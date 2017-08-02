#! /usr/bin/env python
import json
from clinviro.schema import schema

target = '../clinviro-frontend/plugins/relay-plugin.js'
introspection_dict = schema.introspect()

with open(target, 'w') as fp:
    fp.write('/* global require: false */\n'
             "var getBabelRelayPlugin = require('babel-relay-plugin');\n"
             'var schema = ')
    json.dump(introspection_dict, fp, indent=2, sort_keys=True)
    fp.write('\n\nmodule.exports = getBabelRelayPlugin(schema)\n')
