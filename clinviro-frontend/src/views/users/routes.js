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
import LoginUser from './login';
import LogoutUser from './logout';
import UserSettings from './settings';

import {Route} from 'react-router';

const routes = (
  <Route
   path="users">
    <Route
     path="login"
     component={LoginUser} />
    <Route
     path="logout"
     component={LogoutUser} />
    <Route
     path="self/settings"
     component={UserSettings} />
  </Route>
);

export default routes;
