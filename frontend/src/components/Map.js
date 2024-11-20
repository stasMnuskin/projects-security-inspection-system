import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const Map = ({ sites }) => {
  const validSites = sites.filter(site => 
    site.latitude && site.longitude && 
    !isNaN(site.latitude) && !isNaN(site.longitude)
  );

  if (validSites.length === 0) {
    return <div>No valid site locations available</div>;
  }

  const center = [validSites[0].latitude, validSites[0].longitude];

  return (
    <MapContainer center={center} zoom={7} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {validSites.map((site) => (
        <Marker key={site.id} position={[site.latitude, site.longitude]}>
          <Popup>{site.name}</Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default Map;
