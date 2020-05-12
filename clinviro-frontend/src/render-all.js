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

import React from 'react';
import PropTypes from 'prop-types';
import Relay from 'react-relay/classic';
import ReactDOM from 'react-dom';
import useRelay from 'react-router-relay';
import {Router, browserHistory,
        applyRouterMiddleware} from 'react-router';
import routes from './routes';
import {BACKEND_URL} from './constants';
import './index.css';


const URL = `${BACKEND_URL}/graphql`;
const environment = new Relay.Environment();
Relay.injectNetworkLayer(new Relay.DefaultNetworkLayer(URL, {
  fetchTimeout: 1200000,
  credentials: 'include'
}));
environment.injectNetworkLayer(new Relay.DefaultNetworkLayer(URL, {
  fetchTimeout: 1200000,
  credentials: 'include'
}));


class _RouteComponent extends React.Component {

  static propTypes = {
    viewer: PropTypes.shape({
      userAuthenticated: PropTypes.bool.isRequired
    }).isRequired
  }

  componentWillMount() {
    const {viewer: {userAuthenticated}} = this.props;
    window.__userAuthenticated = userAuthenticated;
  }

  render() {
    return (
      <Router
       routes={routes}
       forceFetch={true}
       render={applyRouterMiddleware(useRelay)}
       history={browserHistory}
       environment={environment} />
    );
  }

}

const RouteComponent = Relay.createContainer(
  _RouteComponent,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          userAuthenticated
        }
      `
    }
  }
);

export default function renderAll() {
  ReactDOM.render(
    <Relay.RootContainer
     Component={RouteComponent}
     route={{
       queries: {
         viewer: () => Relay.QL`
           query { viewer }
         `
       },
       params: {},
       name: 'rootQueryConfig'
     }} />,
    document.getElementById('root')
  );
}
