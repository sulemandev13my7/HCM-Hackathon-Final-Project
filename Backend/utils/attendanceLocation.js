const EARTH_RADIUS_METERS = 6371000;

const toRadians = (value) => (value * Math.PI) / 180;

const distanceInMeters = (first, second) => {
  const latDelta = toRadians(second.lat - first.lat);
  const lngDelta = toRadians(second.lng - first.lng);
  const firstLat = toRadians(first.lat);
  const secondLat = toRadians(second.lat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const readCoordinate = (value, min, max) => {
  const coordinate = Number(value);
  if (!Number.isFinite(coordinate) || coordinate < min || coordinate > max) {
    return null;
  }
  return coordinate;
};

const validateCameraLocation = ({ settings, location }) => {
  const officeLat = readCoordinate(settings?.officeLat, -90, 90);
  const officeLng = readCoordinate(settings?.officeLng, -180, 180);
  if (officeLat === null || officeLng === null) {
    return { error: "Office location is not configured. Ask Admin to set it." };
  }

  const lat = readCoordinate(location?.lat, -90, 90);
  const lng = readCoordinate(location?.lng, -180, 180);
  if (lat === null || lng === null) {
    return { error: "Location access is required for camera check-in." };
  }

  const accuracy = Number(location?.accuracy);
  if (Number.isFinite(accuracy) && accuracy > 100) {
    return {
      error: "GPS accuracy is too low. Move to an open area and try again.",
    };
  }

  const radius = Number(settings?.officeRadius) || 150;
  const distance = distanceInMeters(
    { lat, lng },
    { lat: officeLat, lng: officeLng },
  );
  if (distance > radius) {
    return {
      error: `You are ${Math.round(distance)}m away. Camera check-in is limited to ${radius}m from the office.`,
    };
  }

  return {
    location: { lat, lng },
    distance: Math.round(distance),
  };
};

module.exports = { distanceInMeters, validateCameraLocation };
