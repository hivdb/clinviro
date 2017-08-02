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
import Relay from 'react-relay/classic';
import {Row, Col} from 'react-flexbox-grid';

import {LoginUser as LoginUserMutation} from '../../mutations';
import {FormHorizental, TextInput, FormButtons} from '../fragments/forms';

class LoginUser extends React.Component {

  static propTypes = {
    location: PropTypes.object
  }

  static contextTypes = {
    router: PropTypes.object
  }

  constructor() {
    super(...arguments);
    this.state = {
      email: '',
      password: '',
      error_messages: []
    };
  }

  handleChange(attr) {
    return val => {
      const newState = {};
      newState[attr] = val;
      this.setState(newState);
    };
  }

  handleAuthChange(props, context) {
    if (window.__userAuthenticated) {
      let {location: {query: {r, q}}} = props;
      r = r || '/';
      context.router.push({
        pathname: r,
        search: q
      });
    }
  }

  componentWillMount() {
    this.handleAuthChange(this.props, this.context);
  }

  handleSubmit(e) {
    e.preventDefault();
    const {email, password} = this.state;
    const onSuccess = response => {
      const {userAuthenticated} = response.loginUser;
      window.__userAuthenticated = userAuthenticated;
      this.handleAuthChange(this.props, this.context);
      if (!userAuthenticated) {
        this.setState({error_messages: [{
          text: 'incorrect email or password',
          level: 'error'
        }]});
      }
    };
    this.props.relay.commitUpdate(
      new LoginUserMutation({email, password}),
      {onSuccess}
    );
  }

  render() {
    const {email, password, error_messages} = this.state;
    return <div>
      <Row><Col sm={12}>
        <h1>Sign in</h1>
        <p>Please sign in to access this website.</p>
      </Col></Row>
      <Row>
        <Col sm={12} md={7}>
          <FormHorizental
            onSubmit={this.handleSubmit.bind(this)}>
            <TextInput
              name="email" type="email" value={email}
              onChange={this.handleChange("email")} />
            <TextInput
              messages={error_messages}
              name="password" type="password" value={password}
              onChange={this.handleChange("password")} />
            <FormButtons
              submitText="Sign in"
              showSubmit
              showReset={false} />
          </FormHorizental>
        </Col>
        <Col sm={12} md={5} />
      </Row>
    </div>;
  }

}

export default Relay.createContainer(LoginUser, {
  fragments: {}
});
