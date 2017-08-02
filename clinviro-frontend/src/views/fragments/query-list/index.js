/**
 * ClinViro
 * Copyright (C) 2017 Stanford HIVDB team.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.

 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.

 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import humanize from 'underscore.string/humanize';
import underscored from 'underscore.string/underscored';
import momentPropTypes from 'react-moment-proptypes';

import style from './style.css';
import {FormInline, TextInput, DateInput, CheckboxInput, FormSelect} from '../forms';


export default class QueryList extends React.Component {

  static contextTypes = {
    router: PropTypes.shape({
      replace: PropTypes.func.isRequired
    }).isRequired
  }

  static propTypes = {
    pathname: PropTypes.string.isRequired,
    query: PropTypes.object.isRequired,
    params: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
      type: PropTypes.oneOfType([
        PropTypes.oneOf(
          ['text', 'number', 'range', 'date', 'select', 'bool']
        ).isRequired,
        PropTypes.func.isRequired
      ]).isRequired,
      options: PropTypes.arrayOf(PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired
      }).isRequired),
      initialValue: PropTypes.oneOfType([
        momentPropTypes.momentObj,
        PropTypes.string,
        PropTypes.number,
        PropTypes.bool
      ])
    })).isRequired,
    elements: PropTypes.arrayOf(
      PropTypes.object.isRequired
    ).isRequired,
    columns: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      title: PropTypes.string,
      dataSource: PropTypes.string,
      valueDecorator: PropTypes.func
    })),
    formExtras: PropTypes.node,
    placeHolder: PropTypes.string.isRequired
  };

  static defaultProps = {
    params: [],
    pathname: '',
    query: {},
    placeHolder: 'No result was found.'
  }

  constructor() {
    super(...arguments);
    const {params} = this.props;
    const state = {};
    for (const {type, initialValue, name} of params) {
      let fallback = '';
      if (type === 'bool') {
        fallback = false;
      }
      else if (type === 'date') {
        fallback = null;
      }
      state[name] = initialValue || fallback;
    }
    this.state = state;
    this._locReplaceTimeout = null;
  }

  handleChange(name) {
    return value => {
      const state = {};
      state[name] = value;
      this.setState(state);
      if (this._locReplaceTimeout) {
        window.clearTimeout(this._locReplaceTimeout);
      }
      this._locReplaceTimeout = setTimeout(() => {
        let {pathname, query} = this.props;
        query = {...query}; // prevent overriding the default reference
        for (const name of Object.keys(this.state)) {
          let value = this.state[name];
          let _name = underscored(name);
          if (value || (value !== null && value.length)) {
            if (value instanceof moment || value instanceof Date) {
              value = moment(value).format('MM-DD-YYYY');
            }
            query[_name] = value;
          }
          else {
            delete query[_name];
          }
        }
        this.context.router.replace({
          pathname,
          query
        });
      }, 200);
    };
  }

  render() {
    const {elements, params, columns, formExtras, placeHolder} = this.props;

    return <div>
      <FormInline>
        {params.map(({name, label, type, onCreate, ...props}, idx) => {
          delete props.initialValue;
          let InputElement = TextInput;
          props.onChange = this.handleChange(name);
          props.value = this.state[name];
          if (type === 'date') {
            InputElement = DateInput;
          }
          else if (type === 'select') {
            InputElement = FormSelect;
            if (props.allowCreate) {
              props.onCreate = value => {
                value = value ? value.value || value.label : null;
                this.handleChange(name)(value);
                onCreate && onCreate(value);
              };
            }
            props.onChange = value => {
              value = value ? value.value || value.label : null;
              this.handleChange(name)(value);
            };
          }
          else if (type === 'bool') {
            InputElement = CheckboxInput;
            props.onChange = e => {
              this.handleChange(name)(e.currentTarget.checked);
            };
            props.checked = props.value;
            delete props.value;
          }
          else if (typeof type === 'function') {
            InputElement = type;
          }
          return (
            <InputElement
             key={idx}
             label={label}
             name={name}
             data-name={name}
             {...props} />);
        })}
        {formExtras}
      </FormInline>
      {elements.length > 0 ?
       <table className={style.queryList}>
         <thead>
           <tr>
             {columns.map(({name, title}, idx) => (
               <th key={idx} data-colname={name}>
                 {title ? title : humanize(name)}
               </th>
             ))}
           </tr>
         </thead>
         <tbody>
           {elements.map((node, idx) => (
             <tr key={idx}>
               {columns.map(({name, dataSource, valueDecorator}, idx) => {
                 dataSource = dataSource || name;
                 return <td key={`td-${idx}`} data-colname={name}>
                   {valueDecorator ?
                    valueDecorator(node[dataSource], node) :
                    node[dataSource]}
                 </td>;
               })}
             </tr>
           ))}
         </tbody>
       </table> :
       <div>{placeHolder}</div>}
    </div>;

  }

}
