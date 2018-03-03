const ngeohash = require('ngeohash');
const Geohash = require('latlon-geohash');
const polyhash = require('polygon-hash');
const reproject = require('reproject');
const epsg = require('epsg');

/**
 * Helper function to find centroid of array
 *
 * @param {any} arr
 * @returns {number[]} Centroid
 */
function getCentroid(arr) {
	return arr.reduce(
		function(x, y) {
			return [x[0] + y[0] / arr.length, x[1] + y[1] / arr.length];
		},
		[0, 0]
	);
}

class GeographyHelper {

	/**
	 * Get geohashes inside coordinates
	 *
	 * @static
	 * @param {object} params
	 * @param {number[]} params.minLatLon [minLat/minLon]
	 * @param {number[]} params.maxLatLon [maxLat/maxLon]
	 * @param {number} precision Precision of the resulting geohashes
	 * @returns {string[]}
	 * @memberof GeographyHelper
	 */
	static getHashesInsideCoords(params, precision) {
		return ngeohash.bboxes(
			params.minLatLon[0],
			params.minLatLon[1],
			params.maxLatLon[0],
			params.maxLatLon[1],
			precision
		);
	}

	/**
	 * Finds hashes inside polygon
	 *
	 * @static
	 * @param {any} polygon
	 * @param {number} precision Precision for the resulting geohashes
	 * @returns {Promise}
	 * @memberof GeographyHelper
	 */
	static getHashesInsidePolygon(polygon, precision) {
		return new Promise((resolve, reject) => {
			polyhash(
				{
					coords: polygon,
					precision: precision,
				},
				(err, hashes) => {
					if (err) {
						reject(err);
					} else {
						resolve(hashes);
					}
				}
			);
		});
	}

	/**
	 * Transforms geohash to bounding coordinates
	 *
	 * @static
	 * @param {string|string[]} geohash
	 * @returns
	 * @memberof GeographyHelper
	 */
	static transformGeohashToCoords(geohash) {
		let geohashIsString = typeof geohash === 'string';
		return geohashIsString
			? ngeohash.decode_bbox(geohash)
			: geohash.map((a) => ngeohash.decode_bbox(a));
	}

	/**
	 * Encodes coords into geohash
	 *
	 * @static
	 * @param {object} coords Coordinates to encode
	 * @param {number} coords.lat Latitude
	 * @param {number} coords.lon Longitude
	 * @param {number} precision Geohash precision in which to encode
	 * @returns {string} Encoded geohash
	 * @memberof GeographyHelper
	 */
	static encodeGeohash(coords, precision) {
		return ngeohash.encode(coords.lat, coords.lon, precision);
	}

	/**
	 * Decodes geohash into coordinates
	 *
	 * @static
	 * @param {string} geohash The geohash to decode
	 * @returns {number[]} Coordinates. [lat, lon]
	 * @memberof GeographyHelper
	 */
	static decodeGeohash(geohash) {
		return ngeohash.decode(geohash);
	}

	/**
	 * Finds neighbours of a given geohash
	 *
	 * @static
	 * @param {string} geohash
	 * @param {string} [direction=undefined] Direction of the neighbour [n/ne/e/se/s/sw/w/nw]
	 * @returns {string[]}
	 * @memberof GeographyHelper
	 */
	static getGeohashNeighbours(geohash, direction = undefined) {
		let neighbours = Geohash.neighbors(geohash);
		return direction ? neighbours[direction] : neighbours;
	}

	/**
	 * Finds center of a GeoJSON
	 *
	 * @static
	 * @param {object} json The GeoJSON to find the center of
	 * @returns {number[]} [lon/lat]
	 * @memberof GeographyHelper
	 */
	static findGeoJSONCenter(json) {
		let center;
		if (typeof json.features[0].geometry.coordinates[0][0][0] !== 'number') {
			center = getCentroid(json.features[0].geometry.coordinates[0][0]);
		} else {
			center = getCentroid(json.features[0].geometry.coordinates[0]);
		}
		return center;
	}

	/**
	 * Reproject GeoJSON to WGS84
	 *
	 * @static
	 * @param {object} json GeoJSON to transform
	 * @returns {object} Transformed GeoJSON
	 * @memberof GeographyHelper
	 */
	static geoJsonReproject(json) {
		try {
			let newJson = reproject.toWgs84(json, undefined, epsg);
			return newJson;
		} catch (err) {
			return json;
		}
	}
}

module.exports = GeographyHelper;
