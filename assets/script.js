$(document).ready(function () {
    // Variables for search
    const searchBtn = $("#button-search");
    let searchTerm = $("#search-term");
    let searchHistory = $("#search-history");
    let searchCity = "";
    const clearBtn = $("#clear-search");

    // Variables for current weather
    const cityHeader = $("#city-date");
    const cityIcon = $("#weather-icon-current");
    const cityTemp = $("#city-temp");
    const cityHumidity = $("#city-humidity");
    const cityWindSpeed = $("#city-wind-speed");
    const cityUVIndex = $("#city-uv-index");

    // Moment Date
    const todaysDate = moment();
    
 
    // Function to build current weather query URL
    
    function buildCurrentQueryURL() {
        // API URL - https://openweathermap.org/current#one

        let queryURL = "https://api.openweathermap.org/data/2.5/weather?";

        // Build object for API call
        let queryParams = { "APPID": "b07abeb530d2aceffda3a30d1c88e617" };
        // Search term
        queryParams.q = searchTerm
            .val()
            .trim();
        // Generate URL
        return queryURL + $.param(queryParams);
    }

    // Function to build page content based on API response
    function updateCurrentWeather(response) {
        // Weather icon details
        let weatherIcon = response.weather[0].icon;
        let weatherIconURL = `https://openweathermap.org/img/wn/${weatherIcon}.png`;
        let weatherIconDescription = response.weather[0].description;
        // Convert temp to fahrenheit
        let tempF = (response.main.temp - 273.15) * 1.80 + 32;
        // City Name
        searchCity = response.name;
        // Current Weather Details
        cityHeader.text(`${searchCity} (${todaysDate.format("DD/MM/YYYY")}) `);
        cityHeader.append(cityIcon.attr("src", weatherIconURL).attr("alt", `${weatherIconDescription}`).attr("title", `${weatherIconDescription}`));
        cityTemp.text(`Temperature: ${tempF.toFixed(2)} ℉`);
        cityHumidity.text(`Humidity: ${response.main.humidity}%`);
        cityWindSpeed.text(`Wind Speed: ${response.wind.speed} MPH`);

        // UV Index  https://openweathermap.org/api/uvi - One Call API
        let currentLat = response.coord.lat;
        let currentLong = response.coord.lon;
        let uvQueryURL = `https://api.openweathermap.org/data/2.5/uvi?appid=b07abeb530d2aceffda3a30d1c88e617&lat=${currentLat}&lon=${currentLong}`;
        // AJAX for Current UV Index
        $.ajax({
            url: uvQueryURL,
            method: "GET"
        })
            .then(function (response) {
                let uvValue = response.value;
                cityUVIndex.text(`UV Index: `);
                let uvSpan = $("<span>").text(uvValue).addClass("p-2");

                // Add bg-color based on UV value
                if (uvValue >= 0 && uvValue < 3) {
                    uvSpan.addClass("green-uv");
                }
                else if (uvValue >= 3 && uvValue < 6) {
                    uvSpan.addClass("yellow-uv");
                }
                else if (uvValue >= 6 && uvValue < 8) {
                    uvSpan.addClass("orange-uv");
                }
                else if (uvValue >= 8 && uvValue < 11) {
                    uvSpan.addClass("red-uv");
                }
                else if (uvValue >= 11) {
                    uvSpan.addClass("purple-uv");
                }

                // Append UV span with CSS to text
                cityUVIndex.append(uvSpan);
            });

        //Get 5-day forecast...https://openweathermap.org/api/one-call-api
        // Use currentLat, currentLong
        let forecastQueryUrl = `https://api.openweathermap.org/data/2.5/onecall?lat=${currentLat}&lon=${currentLong}&exclude=current,minutely,hourly&appid=b07abeb530d2aceffda3a30d1c88e617`;
        // AJAX for Current 5-day forecast cards
        $.ajax({
            url: forecastQueryUrl,
            method: "GET"
        })
            .then(function (response) {
                // Fill out card text
                $(".card-day").each(function (day) {
                    day = day + 1;
                    // Forecast date
                    let cardDateMoment = moment.unix(response.daily[day].dt).format("DD/MM/YYYY");
                    // Weather Icon Details
                    let weatherCardIcon = response.daily[day].weather[0].icon;
                    let weatherCardIconURL = `https://openweathermap.org/img/wn/${weatherCardIcon}.png`;
                    let weatherCardIconDesc = response.daily[day].weather[0].description;
                    // Temp: Convert the temp to fahrenheit
                    let cardTempF = (response.daily[day].temp.day - 273.15) * 1.80 + 32;
                    // Humidity
                    let cardHumidity = response.daily[day].humidity;
                    // Wind
                    let cardWind = response.daily[day].wind_speed;
                    // Fill out Forecast cards
                    // Date
                    $($(this)[0].children[0].children[0]).text(cardDateMoment);
                    // Weather Icon
                    $($(this)[0].children[0].children[1].children[0]).attr("src", weatherCardIconURL).attr("alt", `${weatherCardIconDesc}`).attr("title", `${weatherCardIconDesc}`);
                    // Temp
                    $($(this)[0].children[0].children[2]).text(`Temp: ${cardTempF.toFixed(2)} ℉`);
                    // Humidity
                    $($(this)[0].children[0].children[3]).text(`Humidity: ${cardHumidity}%`);
                    // Wind
                    $($(this)[0].children[0].children[4]).text(`Wind: ${cardWind} MPH`);
                });
            })
    };

    // store search history to get lengh of local storage and use that as a key
    function storeSearchTerms(searchedCity) {
        // use an argument so that this can be resused in other button events
        localStorage.setItem("city" + localStorage.length, searchedCity);
    }

    // Searched cities 
    let storedSearchList = "";
    function displaySearchTerms() {
        // Empty the search results div to render only one button per city
        searchHistory.empty();
        // Create a button for each searched city
        for (let i = 0; i < localStorage.length; i++) {
            storedSearchList = localStorage.getItem("city" + i);
            let searchHistoryBtn = $("<button>").text(storedSearchList).addClass("btn btn-secondary button-srch m-2").attr("type", "submit");
            searchHistory.append(searchHistoryBtn);
        }
    }

    //Event Listeners
    // Search box display weather for searched city
    searchBtn.on("click", function (event) {
        event.preventDefault();
        storeSearchTerms(searchTerm[0].value.trim());
        displaySearchTerms();

        let queryURL = buildCurrentQueryURL();

        $.ajax({
            url: queryURL,
            method: "GET"
        })
            .then(updateCurrentWeather);
    });

    // Add event listener for the dynamically created buttons
    $(document).on("click", ".button-srch", function () {
        //not needed since there is no "submit" button - event.preventDefault();
        let pastCity = $(this).text();

        storeSearchTerms(pastCity);

        $.ajax({
            url: `https://api.openweathermap.org/data/2.5/weather?appid=b07abeb530d2aceffda3a30d1c88e617&q=${pastCity}`,
            method: "GET"
        })
            .then(updateCurrentWeather);
    });

    // Clear past search cities
    clearBtn.on("click", function () {
        localStorage.clear();
        searchHistory.empty();
        location.reload();
    });

    
    // Load default a city OR load the last item in local storage
    $(window).on("load", function () {
        // Show past search buttons when the page loads
        displaySearchTerms();
        // Grab last searched city
        let pastCity = localStorage.getItem("city" + (localStorage.length - 1));
        // Query string for ajax
        let qurl = "";
        // Set qurl
        if (localStorage.length === 0) {
            qurl = "https://api.openweathermap.org/data/2.5/weather?appid=b07abeb530d2aceffda3a30d1c88e617&q=Adelaide";
        } else {
            qurl = `https://api.openweathermap.org/data/2.5/weather?appid=b07abeb530d2aceffda3a30d1c88e617&q=${pastCity}`;
        }
        $.ajax({
            url: qurl,
            method: "GET"
        })
            .then(updateCurrentWeather);
    });
});



