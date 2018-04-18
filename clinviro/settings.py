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

import os
import json
from flask import Flask

from .app import app_extension


@app_extension
def register_config(app: Flask) -> Flask:
    app.config.from_object('clinviro.config.Default')
    return app


@app_extension
def register_db(app: Flask) -> Flask:
    from flask_sqlalchemy import SQLAlchemy
    from sqlalchemy_utils.types.choice import Choice
    from flask_alembic import Alembic

    def ext_default(v):
        if hasattr(v, 'isoformat'):
            return v.isoformat()
        elif isinstance(v, Choice):
            return v.value
        return v

    def json_dumps(d):
        return json.dumps(d, default=ext_default)

    class CVSQLAlchemy(SQLAlchemy):

        def apply_driver_hacks(self, app, info, options):
            options['json_serializer'] = json_dumps
            return (
                super(CVSQLAlchemy, self)
                .apply_driver_hacks(app, info, options))

    app.db = CVSQLAlchemy(app)
    Alembic(app)
    return app


@app_extension
def register_es(app: Flask) -> Flask:
    from flask_elasticsearch import FlaskElasticsearch
    app.es = FlaskElasticsearch(app)
    return app


@app_extension
def register_cors(app: Flask) -> Flask:
    from flask_cors import CORS
    CORS(app,
         supports_credentials=True,
         resources={
             r"/graphql": {"origins": app.config['ALLOWED_ORIGIN']},
             r"/depot/*": {"origins": app.config['ALLOWED_ORIGIN']}
         })
    return app


@app_extension
def register_models(app: Flask) -> Flask:
    from sqlalchemy_utils import force_auto_coercion
    force_auto_coercion()

    from . import models
    app.models = models
    return app


@app_extension
def register_login_manager(app: Flask) -> Flask:
    from datetime import timedelta

    from flask import session
    from flask_login import LoginManager
    login_manager = LoginManager()
    login_manager.init_app(app)

    @login_manager.user_loader
    def load_user(user_id):
        return app.models.User.query.get(user_id)

    @app.before_request
    def set_session_timeout():
        session.permanent = True
        app.permanent_session_lifetime = timedelta(hours=8)

    return app


@app_extension
def register_graphql(app: Flask) -> Flask:
    from flask_graphql import GraphQLView
    from .schema import schema
    app.add_url_rule(
        '/graphql',
        view_func=GraphQLView.as_view('graphql', schema=schema, graphiql=True))
    return app


@app_extension
def register_sierra_client(app: Flask) -> Flask:
    from sierrapy import SierraClient
    app.sierra_client = SierraClient()
    return app


@app_extension
def register_depot(app: Flask) -> Flask:
    from flask import request
    from werkzeug import Response
    from depot.manager import DepotManager
    from flask_login import login_required

    try:
        os.makedirs(app.config['DEPOT_STORAGE_PATH'])
    except FileExistsError:
        pass

    DepotManager.configure(
        'default', {'depot.storage_path': app.config['DEPOT_STORAGE_PATH']})
    app.depot_middleware = DepotManager.make_middleware(None, cache_max_age=0)

    @app.route('/depot/<path:path>', methods=['GET', 'HEAD'])
    @login_required
    def depot_proxy(path):
        kwargs = {}

        def fake_start_response(status, headers):
            kwargs['status'] = status
            kwargs['headers'] = headers

        kwargs['response'] = \
            app.depot_middleware(request.environ, fake_start_response)
        return Response(**kwargs)

    return app


@app_extension
def regiseter_commands(app: Flask) -> Flask:
    from . import commands  # noqa
    return app


@app_extension
def register_jinja2_filters(app: Flask) -> Flask:
    from jinja2 import evalcontextfilter, Markup, escape

    @app.template_filter()
    @evalcontextfilter
    def nl2br(eval_ctx, value):
        result = escape(value).replace('\n', Markup('<br />'))
        if eval_ctx.autoescape:
            result = Markup(result)
        return result

    return app
