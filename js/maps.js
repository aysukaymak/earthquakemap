//LAYERS
const lightMap=L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{style_id}/tiles/{z}/{x}/{y}/?access_token={accessToken}', {
    attribution:'© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/" target="_blank">| Improve this map</a>',
    maxZoom:18,
    style_id: 'light-v11',
    accessToken: API_KEY
});

const darkMap=L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{style_id}/tiles/{z}/{x}/{y}/?access_token={accessToken}', {
    attribution:'© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/" target="_blank">| Improve this map</a>',
    maxZoom:18,
    style_id: 'dark-v11',
    accessToken: API_KEY
});

const satMap=L.tileLayer('https://api.mapbox.com/styles/v1/mapbox/{style_id}/tiles/{z}/{x}/{y}/?access_token={accessToken}', {
    attribution:'© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> <a href="https://www.mapbox.com/map-feedback/" target="_blank">| Improve this map</a>',
    maxZoom:18,
    style_id: 'satellite-v9',
    accessToken: API_KEY
});

const quakeLayer=new L.LayerGroup();
const faultLayer=new L.LayerGroup();

//Initialize the map on the "map" div with a given center and zoom
const map = L.map('map', {
    center:[38.626995, 34.719975], //Initial geographic center of the map (LatLng)
    zoom:7, //Initial map zoom level
    layers: [darkMap] //Array of layers that will be added to the map initially
}); 

const baseMap={
    'Light':lightMap,
    'Dark':darkMap,
    'Satellite':satMap
};

const overlays={
    'Earthquakes':quakeLayer,
    'Fault Lines':faultLayer
};

//The layers control gives users the ability to switch between different base layers and switch overlays on/off 
L.control.layers(baseMap, overlays, {
    position: 'topright'
}).addTo(map);

//The sidebar control gives users the ability to access the menu 
L.control.sidebar('sidebar').addTo(map);


//QUAKES
const usgsJson='https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_month.geojson';
$.ajax({url:usgsJson, //url to data
        dataType:'json', //data type
        //instructions for what should happen if the request succeeds or fails
        success: function(data){
            createQuake(data); //if the request succeeds, create geoJson layer
        },
        error: function (xhr) {
            alert(xhr.statusText) //if the request fails, log the error
        }
});

function createQuake(features){
    function colorScale(sig){
        return sig>1000 ? '#ff0000':
               sig>800 ? '#ff5040':
               sig>600 ? '#ff7a70':
               sig>400 ? '#ffa19b':
               sig>200 ? '#ffc5c4':'#ffd7d7';
    };
    function styleCircle(features){
        return {radius:3*(features.properties.mag),
                fillColor:colorScale(features.properties.sig),
                color: colorScale(features.properties.sig),
                fillOpacity: 0.6,
                opacity: 1,
                stroke: true,
                weight:1
            };
    };
    function eachQuake(features, layer){
        layer.bindPopup(`<h3>Location: ${features.properties.place}</h3>
                        <h>Magnitude: ${features.properties.mag}</h><br><br>
                        <h>Significance: ${features.properties.sig}</h><br><br>
                        <h>Time: ${getTime(features.properties.time).toString()}</h><br><br>
                        <h>Risk of Tsunami: ${features.properties.tsunami}</h>`);
        
    };
    L.geoJSON(features, {
        style: styleCircle,
        onEachFeature: eachQuake,
        pointToLayer:function(features, latlng){
            return L.circleMarker(latlng, styleCircle);}
    }).addTo(quakeLayer);
};
quakeLayer.addTo(map);

//SIGNIFINANCE LEGEND
const legend=L.control({
    position:'bottomright'
});
legend.onAdd=function(map){
    const div=L.DomUtil.create('div', 'info legend');
    const categories = ['#ff0000','#ff5040','#ff7a70','#ffa19b', '#ffc5c4', '#ffd7d7'];
    const texts=['>1000', '>800', '>600', '>400', '>200', '>0'];
    const labels=[];

    for(let i=0; i<categories.length; i++){
        labels.push(`<i style="background:${categories[i]}"></i> ${texts[i]}`);
    }
    div.innerHTML=labels.join('<br>');
    return div;
};
legend.addTo(map);

//FAULTS 
const faultJson='../geoJsonData/gem_active_faults.geojson';
$.ajax({url:faultJson,
        dataType:'json',
        success: function(data){
            createFaults(data); 
        },
        error: function(xhr){
            alert(xhr.statusText);
        }
});

function createFaults(features){
    function styleLine(features){
        return {
            color:'blue',
            weight:5,
            opacity:0.1
        };
    };
    function eachFault(features, layer){
        layer.bindPopup(`<h3>Name of Fault Zone: ${features.properties.name}(${features.properties.fz_name})</h3>
                        <h>Last Movement: ${features.properties.last_movement}</h><br><br>
                        <h>Slip Type: ${features.properties.slip_type}</h><br><br>
                        <h>Slip Rate: ${features.properties.net_slip_rate}</h>`);
    };
    L.geoJSON(features, {
        style:styleLine,
        onEachFeature:eachFault
    }).addTo(faultLayer)
};

//LATEST EARTHQUAKE LIST
const latest = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson';
const earthquakeDiv = document.getElementById('latest'); // Select the HTML element to display the earthquake data
fetch(latest) // Fetch the earthquake data from the USGS feed and handle the response
    .then(response => response.json())
    .then(data => { // Iterate over all earthquake events
        data.features.forEach(event => {
            const hr = document.createElement('hr');
            earthquakeDiv.appendChild(hr);

            const location = document.createElement('p');
            location.textContent = `Location: ${event.properties.place}`;
            earthquakeDiv.appendChild(location);
    
            const magnitude = document.createElement('p');
            magnitude.textContent = `Magnitude: ${event.properties.mag}`;
            earthquakeDiv.appendChild(magnitude);
    
            const time = document.createElement('p');
            time.textContent = `Time: ${getTime(event.properties.time).toString()}`;
            earthquakeDiv.appendChild(time);
        });
    })
    .catch(error => {
        console.error('Error fetching earthquake data:', error); // Handle any errors that occur during the fetch request
    });
    
//The Date() constructor takes an integer value that represents the number of milliseconds since January 1, 1970, 00:00:00 UTC and returns a Date object.
function getTime(time){
    const date= new Date(time);
    return date;
};