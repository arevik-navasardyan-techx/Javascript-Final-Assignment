const sortBtn = document.getElementById("showSortBtn");
const sortBy = document.getElementById("sortBy");
const filterBtn = document.getElementById("showFilterBtn");
const filterSection = document.getElementById("filters");
const arrowSort = document.getElementById("sortBtnSpan");
const arrowFilter = document.getElementById("filterBtnSpan");
const searchAll = document.getElementById("search-all-releases");
const otherReleases = document.getElementById("otherReleases");
const searchCountry = document.getElementById("search-all-countries");
const selectCountry = document.getElementById("selectCountry");
const movieSection = document.getElementById("movieSection");
const loadMoreBtn = document.getElementById("loadMoreBtn");
const filterForm = document.getElementById("filterForm");
const searchBtn = document.getElementById("searchBtn");
const sortSelect = document.getElementById("sortOptions");

let currentPage = 1;
let isFiltered = false;
let currentQuery = "";
let GENRE_MAP = {};

const API_KEY =
  "Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI1NWYyMzdlNTRlMDRmZDA1MzA1MzFiNTlmZjhiMGU5NyIsIm5iZiI6MTc1NDQ3MDY4MC45ODcsInN1YiI6IjY4OTMxOTE4ZDEyMDM4NmY4OTExZTU4MSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.r2FrPJi5tejPIImPSnJ-y4elVjTulWOID_FTAdlSdNs";
const SORT_MAP = {
  "Popularity Descending": "popularity.desc",
  "Popularity Ascending": "popularity.asc",
  "Rating Descending": "vote_average.desc",
  "Rating Ascending": "vote_average.asc",
  "Release Date Descending": "primary_release_date.desc",
  "Release Date Ascending": "primary_release_date.asc",
  "Title (A-Z)": "original_title.asc",
  "Title (Z-A)": "original_title.desc",
};

// ui helpers
function showSection(btn, sectionEl, arrowEl) {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = sectionEl.style.display === "block";
    sectionEl.style.display = isOpen ? "none" : "block";
    arrowEl.style.transform = isOpen ? "rotate(0deg)" : "rotate(90deg)";
  });
}

function showDivIfNotChecked(checkbox, section) {
  checkbox.addEventListener("change", () => {
    section.style.display = checkbox.checked ? "none" : "block";
  });
}

function bindGenreTagSelection() {
  document
    .querySelectorAll(".genre-tags input[type='checkbox']")
    .forEach((cb) => {
      const set = () =>
        cb.parentElement.classList.toggle("selected", cb.checked);
      cb.addEventListener("change", set);
      set();
    });
}

function enableSearchOnChange() {
  filterForm.addEventListener("change", () => {
    searchBtn.disabled = false;
  });
}

function fetchGenres() {
  const url = "https://api.themoviedb.org/3/genre/movie/list?language=en-US";
  return fetch(url, {
    method: "GET",
    headers: { accept: "application/json", Authorization: API_KEY.trim() },
  })
    .then((res) => res.json())
    .then((data) => {
      GENRE_MAP = {};
      (data.genres || []).forEach((g) => (GENRE_MAP[g.name] = g.id));
    });
}

function fetchMovies(page) {
  const url = `https://api.themoviedb.org/3/movie/popular?language=en-US&page=${page}`;
  return fetch(url, {
    method: "GET",
    headers: { accept: "application/json", Authorization: API_KEY.trim() },
  })
    .then((res) => res.json())
    .then((json) => addMovies(json.results || []));
}

function fetchMoviesFiltered(page, queryString) {
  const url = `https://api.themoviedb.org/3/discover/movie?page=${page}&${queryString}`;
  return fetch(url, {
    method: "GET",
    headers: { accept: "application/json", Authorization: API_KEY.trim() },
  })
    .then((res) => res.json())
    .then((json) => addMovies(json.results || []));
}

function buildDiscoverQueryFromForm() {
  const params = new URLSearchParams();
  const sortLabel = sortSelect?.value || "Popularity Descending";
  params.set("sort_by", SORT_MAP[sortLabel] || "popularity.desc");

  const selectedGenreIds = Array.from(
    filterForm.querySelectorAll('input[name="genre"]:checked')
  )
    .map((cb) => GENRE_MAP[cb.value])
    .filter(Boolean);
  if (selectedGenreIds.length)
    params.set("with_genres", selectedGenreIds.join(","));

  const from = document.getElementById("dateFrom")?.value || "";
  const to = document.getElementById("dateTo")?.value || "";
  const languageVal = document.getElementById("selectLanguage").value;
  if (from) params.set("primary_release_date.gte", from);
  if (to) params.set("primary_release_date.lte", to);
  if (languageVal && languageVal !== "Non Selected") {
    params.set("with_original_language", languageVal);
  }

  params.set("language", "en-US");
  params.set("include_adult", "false");
  params.set("include_video", "false");

  return params.toString();
}

function addMovies(movies) {
  movies.forEach((movie) => {
    const poster = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "images/no-poster.jpg";
    const title = movie.original_title || movie.title || "No title";
    const date = movie.release_date || "No release date";
    const percentage = movie.vote_average
      ? `${Math.round(movie.vote_average * 10)}%`
      : "NR";
    const overview = movie.overview || "";
    const movieDiv = document.createElement("div");
    movieDiv.className = "movie";
    movieDiv.innerHTML = `
      <div class="img-container">
        <div class="mv-img">
          <img src="${poster}" alt="${title}" />
        </div>
        <div class="round">
          <div class="upper-percentage">
            <div class="lower-percentage">${percentage}</div>
          </div>
        </div>
      </div>
      <div class="mv-name-date">
        <p class="mv-name">${title}</p>
        <p class="mv-date">${date}</p>
        <p class="mv-overview">${overview}</p>
      </div>
    `;
    movieSection.appendChild(movieDiv);
  });
}

showSection(sortBtn, sortBy, arrowSort);
showSection(filterBtn, filterSection, arrowFilter);
showDivIfNotChecked(searchAll, otherReleases);
showDivIfNotChecked(searchCountry, selectCountry);

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  currentPage = 1;
  movieSection.innerHTML = "";
  currentQuery = buildDiscoverQueryFromForm();
  isFiltered = true;
  fetchMoviesFiltered(currentPage, currentQuery).finally(() => {
    searchBtn.disabled = true;
  });
});

loadMoreBtn.addEventListener("click", () => {
  currentPage++;
  if (isFiltered) fetchMoviesFiltered(currentPage, currentQuery);
  else fetchMovies(currentPage);
});

document.addEventListener("DOMContentLoaded", async () => {
  await fetchGenres();
  await fetchMovies(currentPage);
  bindGenreTagSelection();
  enableSearchOnChange();
});
