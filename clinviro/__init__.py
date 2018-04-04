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

from aiohttp import web
from aiohttp_wsgi import WSGIHandler

from .app import init_app
from . import settings  # noqa
from .version import VERSION

__version__ = VERSION

app = init_app()

wsgi_handler = WSGIHandler(app)
aioapp = web.Application()
aioapp.router.add_route("*", "/{path_info:.*}", wsgi_handler)
