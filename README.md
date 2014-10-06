# TODO

* document react features
  * `<this.props.foo />`
  * call methods on instances using refs

# App Architecture

## Stores

Two ways to return data:

* immediate/changed

```js
setState({foos: store.getFoos()});
store.on('foos-changed', function () { this.setState({foos: store.getFoos()}); });
store.loadFoos();
```

* promise

```js
store.loadFoos().then(function (data) {
  this.setState({foos: data});
});
```

Optimistic load: when data is required, store can return previous data, query for new data and
emit 'changed' when it arrives.

Optimistic save: store can e.g. edit collections immediately to improve user experience
(more problematic)

If a store emits a 'changed' event every time something is changed, everybody can update
via this.setState().

Both serverside and clientside pagination (or a combination) can be supported transparently to
a grid

## Controller Views

Controller views have state. State is loaded from 

## Views

Views
 
* receive parent state via props;
* communicate user interactions via callbacks:

```
<SomeView foos={this.state.foos} onEdited={this.onFooEdited} />
```

# Architecture

## Server interface


# Components

## Grid

### Filters

* filters before the grid
* filters in column headings

Filter specification:

```js
{
  key: 'foo',
  label: '- Foo -',
  type: 'input|range|select|multiselect|custom',
  
  // for 'select' / 'multiselect'
  choices: [{l: 'foo', v: 'bar'}, {l: 'foo', v: 'bar'}, {l: 'foo', v: 'bar'}],
  // - or -
  choices: callable_returnuing_promise().then(function (data) {
      return data.map(function (el) {
          return {l: el.foo, v: el/bar};
      })
  }),
  
  // for 'custom'
  widget: React.createClass({ ... })
}
```

## Form

### Lfecycle

### Validation

