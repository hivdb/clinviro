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

# -*- coding: utf-8 -*-


class AbstractGeneratorMeta(type):

    singletons = {}

    def __init__(cls, name, bases, attrs):
        if bases and (attrs['content_type'] is None or
                      attrs['mimetype'] is None):
            raise NotImplementedError(
                'class attribution `content_type` is not defined')
        super(AbstractGeneratorMeta, cls).__init__(name, bases, attrs)

    def __call__(cls, *args, **kwargs):
        metacls = type(cls)
        if cls not in metacls.singletons:
            metacls.singletons[cls] = \
                super(AbstractGeneratorMeta, cls).__call__(*args, **kwargs)
        return metacls.singletons[cls]


class AbstractGenerator(metaclass=AbstractGeneratorMeta):

    content_type = None
    mimetype = None

    def render(self, **kwargs):
        raise NotImplementedError('function `render` should be implemented')
