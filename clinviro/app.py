# ClinViro
# Copyright (C) 2017 Stanford HIVDB team.
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.

# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from typing import Callable

from flask import Flask


def _app_closure() -> tuple:
    """Closure contains functions used to initialize flask app

    Variables inside would not be expose to the outsite (strictly).
    You can only expose variables via returning.

    .. Note::
        This function is deleted after module imported.

    """
    app = None
    app_extensions = []

    def app_extension(
            callback: Callable[[Flask], Flask]) -> Callable[[Flask], Flask]:
        """Register a function to be called after app initialized

        This is normally used as a decorator to register extensions.
        For example::

            @app_extension
            def init_app(app):
                # do something with app
                pass

        If the app object has already been initialized, this decorator
        will run the callback immediately. Else it will defer the calling
        to :func:`init_app`.

        Args:
            callback (Callable): The function to be called

        Returns:
            Callable object: The callback argument itself.
        """
        nonlocal app
        if app:
            # run the callback directly if app has been initialized
            with app.app_context():
                app = callback(app)
        else:
            app_extensions.append(callback)
        return callback

    def init_app() -> Flask:
        """Entry point to initialize a Flask app

        This function also receives extensions registered by
        :func:`app_extension` and run them after app initialized.

        Returns:
            Flask object.
        """
        nonlocal app
        app = Flask(__name__.rsplit('.', 1)[0])
        for cb in app_extensions:
            with app.app_context():
                app = cb(app)
        return app

    return init_app, app_extension

init_app, app_extension = _app_closure()
del _app_closure
