import React, { useRef, useEffect, useState } from 'react';
import vietmapgl from '@vietmap/vietmap-gl-js/dist/vietmap-gl.js';
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css';

const MapComponent = () => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const marker = useRef(null);
  const popup = useRef(null);

  const [lng] = useState(106.6297);
  const [lat] = useState(10.8231);
  const [zoom] = useState(18);
  const [selectedLocation, setSelectedLocation] = useState({ lng, lat });
  const [address, setAddress] = useState('');

  async function getAddressFromLatLng(lng, lat) {
    const apiKey = import.meta.env.VITE_VIETMAP_API_KEY;
    const url = `https://maps.vietmap.vn/api/reverse/v3?apikey=${apiKey}&lng=${lng}&lat=${lat}`;
    const response = await fetch(url);
    return response.json();
  }

  useEffect(() => {
    if (map.current) return;
    map.current = new vietmapgl.Map({
      container: mapContainer.current,
      style: `https://maps.vietmap.vn/maps/styles/tm/style.json?apikey=${
        import.meta.env.VITE_VIETMAP_API_KEY
      }`,
      center: [lng, lat],
      zoom,
    });

    map.current.on('load', async () => {
      map.current.resize();
      const data = await getAddressFromLatLng(lng, lat);

      if (data && data[0].display) {
        setAddress(data[0].display);
        popup.current = new vietmapgl.Popup().setHTML(
          '<strong>Bạn đang chọn địa chỉ ở đây</strong><p><b>Kinh độ</b>: ' +
            lng.toFixed(6) +
            '</p><p><b>Vĩ độ</b>: ' +
            lat.toFixed(6) +
            '</p><p><b>Địa chỉ</b>: ' +
            data[0].display +
            '</p>'
        );
        marker.current = new vietmapgl.Marker({ draggable: true, color: 'red' })
          .setLngLat([lng, lat])
          .setPopup(popup.current)
          .addTo(map.current);

        async function onDragEnd() {
          const lngLat = marker.current.getLngLat();
          setSelectedLocation({
            lng: lngLat.lng,
            lat: lngLat.lat,
          });
          // Call Vietmap reverse geocoding API
          try {
            const data = await getAddressFromLatLng(lngLat.lng, lngLat.lat);
            if (data && data[0].display) {
              setAddress(data[0].display);
              if (popup.current) {
                popup.current.remove();
              }
              popup.current = new vietmapgl.Popup().setHTML(
                '<strong>Bạn đang chọn địa chỉ ở đây</strong><p><b>Kinh độ</b>: ' +
                  lngLat.lng.toFixed(6) +
                  '</p><p><b>Vĩ độ</b>: ' +
                  lngLat.lat.toFixed(6) +
                  '</p><p><b>Địa chỉ</b>: ' +
                  data[0].display +
                  '</p>'
              );
              marker.current.setPopup(popup.current);
            } else {
              setAddress('Không tìm thấy địa chỉ');
            }
          } catch {
            setAddress('Lỗi khi lấy địa chỉ');
          }
        }

        marker.current.on('dragend', onDragEnd);
      }
    });

    setTimeout(() => {
      if (map.current) map.current.resize();
    }, 0);
    map.current.addControl(new vietmapgl.NavigationControl(), 'top-right');
  }, [lng, lat, zoom]);

  useEffect(() => {
    const handleResize = () => {
      if (map.current) map.current.resize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%' }}>
      <div ref={mapContainer} className="map-container" style={{ height: '100%', width: '100%' }} />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: '100%',
          width: 320,
          background: 'rgba(255,255,255,0.97)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          padding: 16,
          overflowY: 'auto',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18 }}>Thông tin vị trí</h3>
        </div>
        <p style={{ margin: '4px 0' }}>
          <strong>Địa chỉ:</strong>
          <br />
          {address}
        </p>
        <p style={{ margin: '4px 0' }}>
          <strong>Tọa độ:</strong>
          <p>Kinh độ: {selectedLocation?.lng?.toFixed(6)}</p>
          <p>Vĩ độ: {selectedLocation?.lat?.toFixed(6)}</p>
        </p>
      </div>
    </div>
  );
};

export default MapComponent;
