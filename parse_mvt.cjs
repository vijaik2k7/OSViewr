const fs = require('fs');
const VectorTile = require('@mapbox/vector-tile').VectorTile;
const Protobuf = require('pbf');

try {
    const buffer = fs.readFileSync('/tmp/tile.mvt');
    const tile = new VectorTile(new Protobuf(buffer));
    console.log("Vector Layers in Tile:");
    for (const name of Object.keys(tile.layers)) {
        console.log("- " + name);
        const layer = tile.layers[name];
        console.log("  Features:", layer.length);
        if (layer.length > 0) {
            console.log("  Sample Feature Props:", JSON.stringify(layer.feature(0).properties));
        }
    }
} catch (err) {
    console.error(err);
}
