const fields = {
  datumLat: document.getElementById("datumLat"),
  datumLon: document.getElementById("datumLon"),
  elapsedHours: document.getElementById("elapsedHours"),
  wu: document.getElementById("wu"),
  weatherFactor: document.getElementById("weatherFactor"),
  speedFactor: document.getElementById("speedFactor"),
  fatigueFactor: document.getElementById("fatigueFactor"),
  altitudeFactor: document.getElementById("altitudeFactor"),
  coverageFactor: document.getElementById("coverageFactor"),
  desiredRange: document.getElementById("desiredRange"),
  minSafeAltitude: document.getElementById("minSafeAltitude"),
  currentDir: document.getElementById("currentDir"),
  currentSpeed: document.getElementById("currentSpeed"),
  windFrom: document.getElementById("windFrom"),
  leewaySpeed: document.getElementById("leewaySpeed"),
  leewayAngle: document.getElementById("leewayAngle"),
  searchSpeed: document.getElementById("searchSpeed"),
  onSceneTime: document.getElementById("onSceneTime"),
  sortieCount: document.getElementById("sortieCount")
};

const outputs = {
  correctedSweepOut: document.getElementById("correctedSweepOut"),
  trackSpacingOut: document.getElementById("trackSpacingOut"),
  podOut: document.getElementById("podOut"),
  horizonAltitudeOut: document.getElementById("horizonAltitudeOut"),
  recommendedAltitudeOut: document.getElementById("recommendedAltitudeOut"),
  driftDirOut: document.getElementById("driftDirOut"),
  driftSpeedOut: document.getElementById("driftSpeedOut"),
  driftDistanceOut: document.getElementById("driftDistanceOut"),
  estimatedPositionOut: document.getElementById("estimatedPositionOut"),
  searchEffortOut: document.getElementById("searchEffortOut"),
  searchAreaOut: document.getElementById("searchAreaOut"),
  summaryBlock: document.getElementById("summaryBlock"),
  copyStatus: document.getElementById("copyStatus")
};

const copySummaryBtn = document.getElementById("copySummaryBtn");

function toNumber(input) {
  const value = Number.parseFloat(input.value);
  return Number.isFinite(value) ? value : 0;
}

function radians(deg) {
  return (deg * Math.PI) / 180;
}

function degrees(rad) {
  return (rad * 180) / Math.PI;
}

function normalizeBearing(value) {
  let bearing = value % 360;
  if (bearing < 0) bearing += 360;
  return bearing;
}

function fmt(value, digits = 2, unit = "") {
  if (!Number.isFinite(value)) return "-";
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ""}`;
}

function vectorFromBearing(speed, bearingToDeg) {
  // Navigation convention: 0 = north, 90 = east.
  const angle = radians(bearingToDeg);
  const east = speed * Math.sin(angle);
  const north = speed * Math.cos(angle);
  return { east, north };
}

function bearingFromVector(east, north) {
  const angleRad = Math.atan2(east, north);
  return normalizeBearing(degrees(angleRad));
}

function destinationLatLon(latDeg, lonDeg, bearingDeg, distanceNm) {
  const earthRadiusNm = 3440.065;
  const lat1 = radians(latDeg);
  const lon1 = radians(lonDeg);
  const brng = radians(bearingDeg);
  const angularDistance = distanceNm / earthRadiusNm;

  const sinLat1 = Math.sin(lat1);
  const cosLat1 = Math.cos(lat1);
  const sinAd = Math.sin(angularDistance);
  const cosAd = Math.cos(angularDistance);

  const lat2 = Math.asin(sinLat1 * cosAd + cosLat1 * sinAd * Math.cos(brng));
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * sinAd * cosLat1,
      cosAd - sinLat1 * Math.sin(lat2)
    );

  return {
    lat: degrees(lat2),
    lon: ((degrees(lon2) + 540) % 360) - 180
  };
}

function compute() {
  const wu = toNumber(fields.wu);
  const weatherFactor = toNumber(fields.weatherFactor);
  const speedFactor = toNumber(fields.speedFactor);
  const fatigueFactor = toNumber(fields.fatigueFactor);
  const altitudeFactor = toNumber(fields.altitudeFactor);
  const coverageFactor = Math.max(0.01, toNumber(fields.coverageFactor));

  const correctedSweep =
    wu * weatherFactor * speedFactor * fatigueFactor * altitudeFactor;
  const trackSpacing = correctedSweep / coverageFactor;
  const pod = 1 - Math.exp(-coverageFactor);

  outputs.correctedSweepOut.textContent = fmt(correctedSweep, 2, "NM");
  outputs.trackSpacingOut.textContent = fmt(trackSpacing, 2, "NM");
  outputs.podOut.textContent = fmt(pod * 100, 1, "%");

  const desiredRange = toNumber(fields.desiredRange);
  const minSafeAltitude = toNumber(fields.minSafeAltitude);
  const horizonAltitude = Math.pow(desiredRange / 1.06, 2);
  const recommendedAltitude = Math.max(horizonAltitude, minSafeAltitude);

  outputs.horizonAltitudeOut.textContent = fmt(horizonAltitude, 0, "ft");
  outputs.recommendedAltitudeOut.textContent = fmt(recommendedAltitude, 0, "ft");

  const currentDir = normalizeBearing(toNumber(fields.currentDir));
  const currentSpeed = toNumber(fields.currentSpeed);
  const windFrom = normalizeBearing(toNumber(fields.windFrom));
  const leewaySpeed = toNumber(fields.leewaySpeed);
  const leewayAngle = toNumber(fields.leewayAngle);

  const downwindTo = normalizeBearing(windFrom + 180);
  const leewayTo = normalizeBearing(downwindTo + leewayAngle);

  const currentVector = vectorFromBearing(currentSpeed, currentDir);
  const leewayVector = vectorFromBearing(leewaySpeed, leewayTo);
  const driftEast = currentVector.east + leewayVector.east;
  const driftNorth = currentVector.north + leewayVector.north;
  const driftSpeed = Math.hypot(driftEast, driftNorth);
  const driftDir = bearingFromVector(driftEast, driftNorth);

  const elapsedHours = toNumber(fields.elapsedHours);
  const driftDistance = driftSpeed * elapsedHours;

  outputs.driftDirOut.textContent = fmt(driftDir, 0, "°T");
  outputs.driftSpeedOut.textContent = fmt(driftSpeed, 2, "kt");
  outputs.driftDistanceOut.textContent = fmt(driftDistance, 2, "NM");

  const datumLat = Number.parseFloat(fields.datumLat.value);
  const datumLon = Number.parseFloat(fields.datumLon.value);
  let estimatedPosition = "Enter datum lat/lon to compute position.";
  if (Number.isFinite(datumLat) && Number.isFinite(datumLon)) {
    const estimated = destinationLatLon(datumLat, datumLon, driftDir, driftDistance);
    estimatedPosition = `${estimated.lat.toFixed(4)}°, ${estimated.lon.toFixed(4)}°`;
  }
  outputs.estimatedPositionOut.textContent = estimatedPosition;

  const searchSpeed = toNumber(fields.searchSpeed);
  const onSceneTime = toNumber(fields.onSceneTime);
  const sortieCount = Math.max(1, toNumber(fields.sortieCount));
  const searchEffort = searchSpeed * onSceneTime * sortieCount;
  const searchableArea = searchEffort * correctedSweep;

  outputs.searchEffortOut.textContent = fmt(searchEffort, 1, "NM");
  outputs.searchAreaOut.textContent = fmt(searchableArea, 1, "NM²");

  outputs.summaryBlock.textContent = [
    "SAR OVER-WATER QUICK SUMMARY",
    "----------------------------",
    `Corrected sweep width (W): ${fmt(correctedSweep, 2, "NM")}`,
    `Track spacing (S): ${fmt(trackSpacing, 2, "NM")} at C=${coverageFactor.toFixed(2)}`,
    `Estimated POD: ${fmt(pod * 100, 1, "%")}`,
    `Recommended search altitude: ${fmt(recommendedAltitude, 0, "ft")}`,
    `Total drift vector: ${fmt(driftDir, 0, "°T")} / ${fmt(driftSpeed, 2, "kt")}`,
    `Drift distance from datum: ${fmt(driftDistance, 2, "NM")} in ${fmt(elapsedHours, 1, "hr")}`,
    `Estimated position: ${estimatedPosition}`,
    `Total search effort: ${fmt(searchEffort, 1, "NM")}`,
    `Estimated searchable area: ${fmt(searchableArea, 1, "NM²")}`
  ].join("\n");
}

Object.values(fields).forEach((field) => {
  field.addEventListener("input", compute);
});

copySummaryBtn.addEventListener("click", async () => {
  const summary = outputs.summaryBlock.textContent;
  outputs.copyStatus.textContent = "";
  try {
    await navigator.clipboard.writeText(summary);
    outputs.copyStatus.textContent = "Summary copied.";
  } catch (error) {
    outputs.copyStatus.textContent = "Unable to access clipboard in this browser context.";
  }
});

compute();
