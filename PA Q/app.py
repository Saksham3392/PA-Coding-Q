"""
==============================================================================
app.py - Alternate / Production WSGI Entry Point
==============================================================================
Role in Project:
----------------
This file acts as a lightweight entrypoint proxy for cloud hosting platforms
and WSGI application servers (such as Render, Heroku, Railway, or Gunicorn).
Many cloud application runners default to executing `python app.py` or importing
`app:app`. 

It imports the fully configured Flask application instance (`app`) from `server.py`
and runs it with dynamic port resolution.

Usage:
- Production (Gunicorn / Render):
    gunicorn app:app
- Local Standalone:
    python app.py
==============================================================================
"""

import os
from server import app

if __name__ == "__main__":
    # Resolve PORT from environment variable (standard in containerized/cloud platforms)
    # Defaulting to 5050 to avoid conflicts with other local dev servers
    port = int(os.environ.get("PORT", 5050))
    print(f"[app.py] Starting server on http://0.0.0.0:{port}...")
    app.run(host="0.0.0.0", port=port, debug=True)

