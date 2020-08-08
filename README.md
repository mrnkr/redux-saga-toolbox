# Redux-Saga Toolbox

[![NPM version][npm-image]][npm-url]
[![Downloads][downloads-image]][npm-url]
[![Build Status](https://travis-ci.com/mrnkr/redux-saga-toolbox.svg?branch=master)](https://travis-ci.com/mrnkr/redux-saga-toolbox)
[![codecov](https://codecov.io/gh/mrnkr/redux-saga-toolbox/branch/master/graph/badge.svg)](https://codecov.io/gh/mrnkr/redux-saga-toolbox)
[![License][license]][npm-url]

[npm-image]:http://img.shields.io/npm/v/@mrnkr/redux-saga-toolbox.svg
[npm-url]:https://npmjs.org/package/@mrnkr/redux-saga-toolbox
[downloads-image]:http://img.shields.io/npm/dm/@mrnkr/redux-saga-toolbox.svg
[license]:https://img.shields.io/github/license/mrnkr/redux-saga-toolbox

A set of utilities meant to have you write less and do more, better.

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

Also, you may fancy using an alternative way of providing your takeEvery parameter. An equivalent way of listening to the same action is `takeEvery: action => action.type === 'REQUEST'`. Why is this useful? Well, say you have multiple actions and they should all trigger the same saga, this can be achieved in the following fashion: `takeEvery: action => action.type === actionType1 || action.type === actionType2`. This I added because I needed it, hope some of you will also find it useful!

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

### Changelog

* 1.0.0 - First release, had some trouble with config files. That's why the actual first release was 1.0.2 😬
* 1.0.3 - If you were one of the few amazing people that downloaded the library as soon as I released it you may have noticed inconsistencies in the documentation... I tried to fix all the problems I could find in this version... Sorry!!
* 1.0.8 - Updated the documentation to fix some discrepancies and fixed the forms reducer so that it does not re-register a form.
* 1.0.9 - Updated selectors to be memoized.
* 1.0.10 - Updated saga generator typings to support predicates as takeEvery and subscribe actions. If you're like me you wanted this to trigger the same saga with multiple actions.
* 1.0.11 - Added support for initial values in the forms module.
* 1.0.12 - Added support for not clearing forms on submit.
* 1.0.13 - Added support for multiple submissions on the same form (sorry if you had to deal with this error 😞)
* 1.0.14 - Fixed bug in addAll in entity adapter (both sorted and unsorted) (having bugs there means that I did not copy the whole thing carelessly, just remade it carelessly 😛)
* 1.0.15 - Fixed bug that when a form had an error the saga stopped running.
* 1.0.16 - Fixed bug in form saga - stops listening when the form is cleared.
* 1.0.18 - Deprecated entity module and forms module. To use entity I encourage you find a way to do it yourself, to manage forms I recommend formik.
* 2.0.0 - Removed deprecated modules

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
