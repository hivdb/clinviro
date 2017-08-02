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
import Relay from 'react-relay/classic';
import style from './style.css';
import {Link} from 'react-router';
import {Grid} from 'react-flexbox-grid';

const navbarLinks = [
  {
    children: 'Home',
    to: '/'
  }, {
    children: 'Add new patient sample',
    to: '/patients/new-sample'
  }
];


class Layout extends React.Component {

  handleLogout() {
    window.__userAuthenticated = false;
    this.setState({});
  }

  render() {
    const userAuthenticated = window.__userAuthenticated;
    return <div className={style.layout}>
      <header className={style.header}>
        <Grid>
          <Link to="/" className={style.headerLink}>Clinical Virology Database</Link>
        </Grid>
      </header>
      <nav className={style.navbar}>
        <Grid>
          <ul className={style.navbarList}>
            {navbarLinks.map((props, idx) => (
              <li key={idx}><Link {...props} className={style.navbarLink} /></li>
            ))}
            <li className={style.pullRight}>
              {userAuthenticated ?
               <Link to="/users/logout" onClick={this.handleLogout.bind(this)}
                className={style.navbarLink}>Sign out</Link> :
               <Link to="/users/login" className={style.navbarLink}>Sign in</Link>}
            </li>
            {userAuthenticated ?
             <li className={style.pullRight}>
               <Link to="/users/self/settings" className={style.navbarLink}>Settings</Link>
             </li>
             : null}
          </ul>
        </Grid>
      </nav>
      <Grid className={style.container}>
        {this.props.children}
      </Grid>
    </div>;

  }

}

export default Relay.createContainer(
  Layout,
  {
    fragments: {
      viewer: () => Relay.QL`
        fragment on Viewer {
          version { text, date }
        }
      `
    }
  }
);
