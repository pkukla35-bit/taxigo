import React, { useMemo } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN as string;

export type LatLng = { lat: number; lng: number; label?: string };

type Props = {
  pickup?: LatLng | null;
  destination?: LatLng | null;
  drivers?: LatLng[];
  center?: LatLng;
  routeCoords?: Array<[number, number]> | null; // [lng, lat] pairs
  style?: any;
  dark?: boolean;
};

function buildHtml({ pickup, destination, drivers, center, routeCoords, dark }: Props) {
  const c = center || pickup || destination || (drivers && drivers[0]) || { lat: 50.0617, lng: 19.9373 };
  const markers: { lat: number; lng: number; label: string; color: string; emoji: string }[] = [];
  if (pickup) markers.push({ lat: pickup.lat, lng: pickup.lng, label: pickup.label || "Odbiór", color: "#FFD600", emoji: "A" });
  if (destination) markers.push({ lat: destination.lat, lng: destination.lng, label: destination.label || "Cel", color: "#0F0F0F", emoji: "B" });
  (drivers || []).forEach((d) =>
    markers.push({ lat: d.lat, lng: d.lng, label: d.label || "Kierowca", color: "#00E676", emoji: "🚕" })
  );
  const style = dark ? "mapbox://styles/mapbox/dark-v11" : "mapbox://styles/mapbox/streets-v12";
  const routeColor = dark ? "#00E676" : "#0F0F0F";
  const route = routeCoords && routeCoords.length > 1 ? JSON.stringify(routeCoords) : "null";

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width" />
<link href="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.css" rel="stylesheet" />
<style>
html,body,#map{margin:0;padding:0;height:100%;width:100%;font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:${dark ? "#0A0A0A" : "#FAFAFA"}}
.mb-pin{display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;border:3px solid #fff;font-weight:900;font-size:13px;box-shadow:0 4px 14px rgba(0,0,0,.45)}
</style>
</head><body>
<div id="map"></div>
<script src="https://api.mapbox.com/mapbox-gl-js/v3.7.0/mapbox-gl.js"></script>
<script>
mapboxgl.accessToken = '${MAPBOX_TOKEN}';
var map = new mapboxgl.Map({
  container: 'map',
  style: '${style}',
  center: [${c.lng}, ${c.lat}],
  zoom: 12,
  language: 'pl',
  attributionControl: false,
});
var markers = ${JSON.stringify(markers)};
var bounds = new mapboxgl.LngLatBounds();
markers.forEach(function(m){
  var el = document.createElement('div');
  el.className = 'mb-pin';
  el.style.background = m.color;
  el.style.color = m.color === '#FFD600' ? '#0F0F0F' : '#fff';
  el.innerHTML = m.emoji;
  new mapboxgl.Marker({element: el}).setLngLat([m.lng, m.lat]).addTo(map);
  bounds.extend([m.lng, m.lat]);
});

map.on('load', function(){
  var route = ${route};
  if (route) {
    map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: { type: 'LineString', coordinates: route } } });
    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      paint: { 'line-color': '${routeColor}', 'line-width': 5, 'line-opacity': 0.9 }
    });
    route.forEach(function(c){ bounds.extend(c); });
  }
  if (markers.length > 1 || (route && route.length > 1)) {
    try { map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 600 }); } catch(e){}
  }
});
</script>
</body></html>`;
}

export default function MapView(props: Props) {
  const html = useMemo(() => buildHtml(props), [props]);
  if (Platform.OS === "web") {
    return (
      <View style={[styles.box, props.style]}>
        <iframe
          srcDoc={html}
          style={{ border: 0, width: "100%", height: "100%" }}
          title="map"
        />
      </View>
    );
  }
  return (
    <View style={[styles.box, props.style]}>
      <WebView
        originWhitelist={["*"]}
        source={{ html }}
        style={{ flex: 1, backgroundColor: "transparent" }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { flex: 1, overflow: "hidden" },
});
