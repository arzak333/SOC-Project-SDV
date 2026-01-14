#!/usr/bin/env python3
"""Entry point for running the SOC Dashboard backend."""

from app import create_app, socketio

app = create_app()

if __name__ == '__main__':
    socketio.run(
        app,
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
