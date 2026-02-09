from flask import Blueprint, jsonify
from app.services.glpi_service import glpi_client

assets_bp = Blueprint('assets', __name__)


@assets_bp.route('/assets', methods=['GET'])
def list_assets():
    """List computers from GLPI."""
    computers = glpi_client.get_computers()
    return jsonify({
        'assets': computers,
        'total': len(computers),
        'source': 'glpi',
    })


@assets_bp.route('/assets/<name>', methods=['GET'])
def get_asset(name):
    """Search for a GLPI asset by hostname."""
    asset = glpi_client.get_computer_by_name(name)
    if not asset:
        return jsonify({'error': 'Asset not found', 'name': name}), 404
    return jsonify(asset)
