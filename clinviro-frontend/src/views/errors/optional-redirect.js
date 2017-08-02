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
import {Link} from 'react-router';
import FaHourGlassHalf from 'react-icons/lib/fa/hourglass-2';

import ErrorBox from './error-box';

export default class OptionalRedirect extends React.Component {

  static contextTypes = {
    router: PropTypes.shape({
      push: PropTypes.func.isRequired
    })
  }

  static propTypes = {
    to: PropTypes.oneOfType([
      PropTypes.object.isRequired,
      PropTypes.string.isRequired,
      PropTypes.func.isRequired
    ]).isRequired,
    children: PropTypes.node.isRequired,
    countdown: PropTypes.number.isRequired
  }

  static defaultProps = {
    countdown: 5
  }

  constructor() {
    super(...arguments);
    this.state = {
      cancelled: false,
      countdown: 0,
      countdownInterval: null
    };
  }

  setCountdownInterval(props) {
    this.setState({countdown: props.countdown});
    const countdownCallback = () => {
      let {countdown, countdownInterval} = this.state;
      countdown --;
      if (countdown === 0) {
        clearInterval(countdownInterval);
        countdownInterval = null;
        this.context.router.push({
          pathname: this.props.to
        });
      }
      this.setState({countdown, countdownInterval});
    };
    const countdownInterval = setInterval(countdownCallback, 1000);
    this.setState({countdownInterval});
  }

  clearCountdownInterval() {
    const {countdownInterval} = this.state;
    if (countdownInterval) {
      clearInterval(countdownInterval);
    }
  }

  componentDidMount() {
    this.setCountdownInterval(this.props);
  }

  componentWillReceiveProps(nextProps) {
    this.clearCountdownInterval();
    this.setCountdownInterval(nextProps);
  }

  componentWillUnmount() {
    this.clearCountdownInterval();
  }

  handleCancel(e) {
    this.clearCountdownInterval();
    this.setState({cancelled: true});
    e && e.preventDefault();
  }

  render() {
    const {to, children} = this.props;
    const {countdown, cancelled} = this.state;

    if (cancelled) {
      return null;
    }

    return (
      <ErrorBox narrow IconComponent={FaHourGlassHalf}>
        The page will be redirect to{' '}
        <Link to={to}>{children}</Link>{' '}
        in {countdown} second{countdown > 1 ? 's' : ''}.<br />
        <a href="#" onClick={this.handleCancel.bind(this)}>
          Click here
        </a> to cancel it.
      </ErrorBox>
    );
  }

}
