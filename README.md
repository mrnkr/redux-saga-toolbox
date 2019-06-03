# Redux-Saga Toolbox

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Twitter Follow][twitter-image]][twitter-url]

[npm-image]:http://img.shields.io/npm/v/@mrnkr/redux-saga-toolbox.svg
[npm-url]:https://npmjs.org/package/@mrnkr/redux-saga-toolbox
[downloads-image]:http://img.shields.io/npm/dm/@mrnkr/redux-saga-toolbox.svg
[twitter-image]:https://img.shields.io/twitter/follow/xmr_nkr.svg?style=social&label=Follow%20me
[twitter-url]:https://twitter.com/xmr_nkr

A set of utilities meant to have you write less and do more, better.

It's pretty well tested (99.07% code coverage which would be 100% if I had been able to make the istanbul comments work for those while (true) lines 😅). For now, either take my word for it or clone the repo and run `yarn test` but I'm learning how to use codecov so that I can put a badge proving this really soon 🤓

### Motivation

Since I started using redux-saga (which I use alongside reduxsauce) I noticed something. Not only was I writing the same logic over and over again but I was also seeing all the devs in the project do things their own way, for better or for worse. We were following no structure nor were we reutilizing logic in any way. How does one solve such a problem? Taking the best from ngrx/entity and creating factory functions whose output are the saga handlers. I like fractal as far as file structures are concerned, by auto generating sagas I can keep the logic within one file without the file getting too big, hence, I can use fractal and be happy :)

### Installation

```zsh
yarn add @mrnkr/redux-saga-toolbox
```

### Quick start

There is a lot going on here, starting won't be too quick... Sorry hehe. Let's go through all possible use cases (at least the ones I could come up with).

#### Single event sagas (the ones that are not observables)

##### The most basic of basic sagas

What did I consider a basic saga? One which is triggered by a request action and dispatches a loading, a commit and a success action. It may dispatch an error action if it needs to. The way to make one of those is the following:

```typescript
import { createSingleEventSaga } from '@mrnkr/redux-saga-toolbox';
import APIClient from 'my-api';

const watcher = createSingleEventSaga({
  takeEvery: 'REQUEST',
  loadingAction: () => ({ type: 'LOADING' }),
  commitAction: payload => ({ payload, type: 'COMMIT' }),
  successAction: payload => ({ payload, type: 'SUCCESS' }),
  errorAction: error => ({ error, type: 'ERROR' }),
  action: APIClient.getMeThatData,
});
```

Basically, just specify the action you want to use as the request action in the `takeEvery` property. Then specify the action creators for the saga to `put` and lastly specify some function to execute as the long running action that represents the center of it all, like... your API call!

##### Task cancellation

Take the same basic saga. Say the download is taking longer than expected and you want to cancel it. Just dispatch the cancel action you specified in the configuration like so:

```typescript
const watcher = createSingleEventSaga({
  ...restOfTheConfiguration,
  cancelActionType: 'CANCEL',
});
```

##### Uploading data with optimistic feedback

Do you enjoy using Google apps? Do you like how they allow you to undo actions instead of making you confirm everything before it gets done? Well, that undo mechanism can easily be implemented with redux-saga-toolbox.

```typescript
const watcher = createSingleEventSaga({
  ...restOfTheConfiguration,
  runAfterCommit: true,
  undoThreshold: 5000,
  undoActionType: 'REQUEST_UNDO',
  undoAction: (payload) => ({ payload, type: 'UNDO' }),
  undoPayloadBuilder?: (args) => { return someProcessedVersionOfTheArgs; },
});
```

Let us dive a bit more into detail... By setting `runAfterCommit` to `true` we're saying that the `commitAction()` should be dispatched with the action payload and before the action gets run, hence, before the data gets processed by the API. The `undoThreshold` is the time the user has to undo the action before it is made definitive, in this example I set it to 5 seconds. Last but not least, `undoActionType` is the action which we will have to dispatch in order to trigger the undoing of the action which will cut the execution of it and also dispatch the `undoAction` with a payload equal to the return value of `undoPayloadBuilder`. You don't need to provide the last function, it defaults to the identity function (returns what it receives). Also, you should know it is a generator function, it returns stuff (if it doesn't it breaks stuff), but it is still a generator function.

Something else you may find useful is that if you define an `undoAction` you may set the `undoOnError` flag to `true` and that will allow you to not have your redux store get corrupt in case of failures.

##### Processing the action payload and the API call result

I wanted to give up on as little flexibility as I possibly could. That means I wanted to be able to process the payload received from the action that triggered the saga and also I wanted to process the result the API gave me. To do that I exposed two hooks which are generator functions which are expected to return the processed payload or result.

This is how they're meant to be used:

```typescript
const watcher = createSingleEventSaga({
  ...restOfTheConfiguration,
  beforeAction: (args) => { return processedArgs; },
  afterAction: (res, args) => { return processedResult; },
});
```

Some details to take into consideration: `beforeAction` gets run before commit regardless of whether the action runs before or after it. If `beforeAction` is provided and `runAfterCommit` is set to `true` then `commitAction()` will have the processed payload instead of the one it received at first. `afterAction` receives the result of the API call and as a second (optional) parameter it receives the payload (as returned by `beforeAction`).

##### Crappy API? Retry!

Redux saga lets us easily retry stuff, I did not use that but I still offer the same possiblity in this library. If you set `retry` to any number greater than 0 (0 is the default value) you will have let your API fail on you without you giving up on it... Good guy you!

```typescript
const watcher = createSingleEventSaga({
  ...restOfTheConfiguration,
  retry: 3,
});
```

##### Taking too long to respond? Timeout

Same logic as above. Nice thing about this? You can use the `timeout` property in conjunction with the `retry` property and give each try a maximum time to complete. Effortlessly, by the way 😍

```typescript
// try 3 times at most but don't let
// each try take longer than 800ms
const watcher = createSingleEventSaga({
  ...restOfTheConfiguration,
  retry: 3,
  timeout: 800,
});
```

#### Observables

Remember the difference between a Promise and an Observable? Promises resolve to a single value and then end their lifecycle. Observables represent streams of data which emit multiple values across their lifecycle. To know more, refer to google... Following are the things you should know if you're going to handle observables within your sagas created with redux-saga-toolbox. There are operations which are not supported like before and after action hooks, which are a problem which can be solved using the map operator in case you're working with an rxjs observable, undoing actions, so on and so forth.

##### Basic configuration

What's basic with observables is subscribing to them, processing the values they emit and notifying errors and completion. That's exactly what the following configuration does:

```typescript
import { createObservableSaga } from '@mrnkr/redux-saga-toolbox';
import APIClient from 'my-api';

const watcher = createObservableSaga({
  observable: APIClient.streamOfInterestingData,
  nextAction: val => ({ type: 'NEXT', payload: val }),
  doneAction: () => ({ type: 'DONE' }),
  errorAction: error => ({ error, type: 'ERROR' }),
});
```

Something worth mentioning is the fact that observables are handled in a way that they should adhere to the Observable specification in rxjs: hence, they should implement the following interface:

```typescript
interface Observable<T> {
  subscribe(
    next: (value: T) => void,
    error?: (error: any) => void,
    complete?: () => void,
  ): Subscription;
}
```

Subscription is an object which implements the following interface:

```typescript
interface Subscription {
  unsubscribe(): void;
}
```

If you're using, for instance, firebase firestore and you're listening to changes in your collection's documents you may turn that observable into one of these like I did in the following snippet:

```typescript
const listenToChatroomsForUserHelper = (userId) => ({
  subscribe: (next, error) => {
    const unsubscribe = db
      .collection('chatrooms')
      .where(`participants.${userId}`, '==', true)
      .onSnapshot(async snap => {
        snap.docChanges.forEach(change =>
          (change.type === 'added' || change.type === 'modified') && next(change)
        );
      }, err => {
        error(err);
      });

    return {
      unsubscribe
    };
  }
});
```

**IMPORTANT**: If your observable emits an error the saga will cancel itself, it will stop listening to the observable, unsubscribe and everything.

##### Manual cancellation

If your observable never completes, like the one in the example above, you can tell the saga to listen to a specific action and cancel then. Like so:

```typescript
const watcher = createObservableSaga({
  ...restOfTheConfiguration,
  cancelActionType: 'CANCEL',
});
```

##### Inactive for too long? Timeout

Your observable may be inactive for too long... Perhaps you don't mind, I think I might care so I added a timeout so that when the observable is inactive for that given amount of time the saga gets cancelled.

```typescript
const watcher = createObservableSaga({
  ...restOfTheConfiguration,
  timeout: 800,
});
```

#### Form handling

Do you need super configurable and super robust form handling that will offer a solution to all the use cases you could possibly face in your work? Well, this is not that solution, it is probably [redux-form](https://github.com/erikras/redux-form/) that you're looking for. Anyway, that is not my cup of tea personally so I created a simpler, smaller alternative. Check it out!

To use it you need to first create the saga:

```typescript
import { createFormSaga } from '@mrnkr/redux-saga-toolbox';
const watcher = createFormSaga();
```

Register the watcher in your root saga afterwards! Don't forget that!

As for the state: it must have a field called `forms` which should be an empty object. The reducer you should register is also provided for you, import it like `import { formReducer } from '@mrnkr/redux-saga-toolbox';` and register it in your root reducer. Now you're ready to start dispatching actions in your forms!

To do that you need to register the actions in your component like:

```typescript
import { formActions } from '@mrnkr/redux-saga-toolbox';
import { bindActionCreators } from 'redux';

const mapDispatchToProps = dispatch => bindActionCreators({
  ...formActions,
}, dispatch);
```

Now, as part of your props, you'll be able to find the following functions at your disposal:

| Action                            | Parameters                                                                                                                                                 | Description                                                                                                                                                          |
|-----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| registerForm(config)              | config = {   formName: string;   fields: string[];   validator: (Dictionary<string>) => Dictionary<boolean>;   onSubmit: (Dictionary<string>) => Action; } | Adds the form object to the state with default values. The validator passed is used from within the saga to handle that logic and so is the onSubmit action creator. |
| onFormChange(change)              | change = {   formName: string;   fieldName: string;   nextValue: string; }                                                                                 | Modifies the value in the field whose name is fieldName within the form whose name is formName.                                                                      |
| formFieldFocus(formName, payload) | formName: string; payload = {   [fieldName]: { focused: true }; };                                                                                         | Marks all fields provided in the payload as in focus.                                                                                                                |
| formFieldBlur(formName, payload)  | formName: string; payload = {   [fieldName]: { focused: false }; };                                                                                        | Marks all fields provided in the payload as not in focus.                                                                                                            |
| submitForm(formName)              | formName: string                                                                                                                                           | Launches the submission process. Handled automatically by the saga.                                                                                                  |

There are a few more but those are expected to be used only by the saga, like the actions which put validation results in the state. You're only expected to access that from the state. By the way, you also have some selectors to use! Import them like: `import { formSelectors } from '@mrnkr/redux-saga-toolbox';` Here they are...

| Selector                      | Description                                                                          |
|-------------------------------|--------------------------------------------------------------------------------------|
| selectValues(state, formName) | Return a Dictionary with the following structure: { [fieldName: string]: string }    |
| selectFields(state, formName) | Return a Dictionary with the following structure: { [fieldName: string]: FormField } |
| selectAll(state, formName)    | Return the complete form object.                                                     |

So, in a nutshell, do the following:

1. Register the saga and the reducer.
2. Register your form.
3. Use the actions from the input changes.

```tsx
import { formSelectors } from '@mrnkr/redux-saga-toolbox';

class MyForm extends Component {

  componentDidMount() {
    this.props.registerForm({
      formName: 'my-form',
      fields: [
        'fieldName',
      ],
      validator: authFormValidator,
      onSubmit: (values) => {
        return Actions.nextAction({
          fieldName: values['fieldName'],
        });
      },
    });
  }

  handleFormChange(e: React.FormEvent<HTMLInputElement>) {
    onFormChange({
      formName: 'my-form',
      fieldName: e.target.name,
      nextValue: e.target.value,
    });
  }

  render() {
    const { onFormChange, formFieldFocus, formFieldBlur, formValues, submitForm } = this.props;
    return (
      <form onSubmit={() => submitForm('my-form')}>
        <input
          name="fieldName"
          type="text"
          value={formValues['fieldName']}
          onChange={this.handleFormChange}
          onFocus={() => formFieldFocus('my-form', { 'fieldName': { focused: true } })}
          onBlur={() => formFieldBlur('my-form', { 'fieldName': { focused: false } })}
        />
      </form>
    );
  }

}

const mapStateToProps = ({ forms }) => ({
  formValues: formSelectors.selectValues(forms, 'my-form'),
});
```

Done! You're handling your forms just like that! Keep your components stateless :) What is more, find a way to register your forms that does not require lifecycle hooks and boom, keep your components funcional only :D

#### Entity adapters

I may document this, but I'd be repetitive. Best check out the original documentation for [ngrx/entity](https://ngrx.io/guide/entity) since the API and most of the code is actually the same. I added it here because I just removed the very few Angular dependencies it had and wanted to understand it a bit better.

### Changelog

* 1.0.0 - First release, had some trouble with config files. That's why the actual first release was 1.0.2 😬
* 1.0.3 - If you were one of the few amazing people that downloaded the library as soon as I released it you may have noticed inconsistencies in the documentation... I tried to fix all the problems I could find in this version... Sorry!!
* 1.0.8 - Updated the documentation to fix some discrepancies and fixed the forms reducer so that it does not re-register a form.

### The boy scout rule

It's not enough to write code well. The code has to be kept clean over time. We've all seen code rot and degrade as time passes. So we must take an active role
in preventing that degradation.

The boy scouts of America have a simple rule that we can apply to our profession.

Leave the campground better than you found it.

If we all checked-in out code a little cleaner than we checked it out, the code simply could not rot. The cleanup doesn't have to be something big. Change one
variable name for the better, break up one function that's a little too large, eliminate one small bit of duplication, clean up one composite if statement.

Can you imagine working on a project where the code simply got better as time passed? Do you believe that any other option is professional? Indeed, isn't continuous
improvement an intrinsic part of professionalism?

Robert C. Martin - from the book Clean Code (he says the took this from another book but I didn't take note which one)
