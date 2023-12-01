const express = require("express");
const app = express();
const fs = require('fs');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require("path"); 
require('dotenv').config()
const port = 3000;


const url = "https://api.themoviedb.org/3/"


function generateCSVandTable(movies) {
  // Sort by Votes
  let tableContent = '<div class="tables-container">';

  // Table 1: Sorted by Votes
  tableContent += '<div class="table-container"><table border="1" id="byVote"> <tr><th>Movies Sorted by Votes</th></tr>';
  movies.sort((a, b) => { return b.vote_count - a.vote_count; });
  const moviesByVote = movies.map((m) => m.original_title)
  const csvFilePath = path.join(__dirname, 'results/movies.csv');
  let csvContent = moviesByVote.join(',') + '\n';
  moviesByVote.forEach((m) => {
    tableContent += `<tr><td>${m}</td></tr>`;
  });
  tableContent += '</table></div>';



  // Table 2: Sorted Alphabetically
  tableContent += '<div class="table-container"><table border="1" id="byAlpha"> <tr><th>Movies Sorted Alphabetically</th></tr>';
  moviesByVote.sort()
  csvContent += moviesByVote.join(',') + '\n';
  moviesByVote.forEach((m) => {
    tableContent += `<tr><td>${m}</td></tr>`;
  });
  tableContent += '</table></div>';

  // Table 3: Sorted Alphabetically (Excluding "A" or "The")
  tableContent += '<div class="table-container"><table border="1" id="byAlpha2"> <tr><th>Movies Sorted Alphabetically (Excluding "A" or "The")</th></tr>';
  movies.sort((a, b) => {
    const removeArticle = (title) => {
      const articles = ['the', 'a'];
      const words = title.split(' ');
      if (articles.includes(words[0].toLowerCase())) {
        return words.slice(1).join(' ');
      }
      return title;
    };

    const titleA = removeArticle(a.original_title);
    const titleB = removeArticle(b.original_title);

    return titleA.localeCompare(titleB);
  });
  const moviesAlpha2 = movies.map((m) => {
    tableContent += `<tr><td>${m.original_title}</td></tr>`;
    return m.original_title
  });
  tableContent += '</table></div>';

  tableContent += '</div>';
  csvContent += moviesAlpha2.join(',') + '\n';
  fs.writeFileSync(csvFilePath, csvContent +'\n');  

  return tableContent;
}


async function grabMovies(year) {
  year = year.toString()
  let count = 0;
  let page = 1;
  let movies = []

  while(count < 10) {
    await axios.get(url + "/movie/top_rated", { headers: { Authorization: `Bearer ${process.env.token}`}, params: {page: page} })
    .then(function (response) {
      let data = response.data.results;
      let moviesByYear = data.filter((e) => {
        return e.release_date.split('-')[0] === year
      });
      page++;
      count += moviesByYear.length;
      movies = movies.concat(moviesByYear)
    })
    .catch(function (error) {
      console.log(error);
    })
    .finally(function () {

    });
    
  }
  console.log(movies)
  return movies;

}
app.use(express.static(path.join(__dirname, 'public')));

//console.log(__dirname);
app.set("view engine", "ejs");

app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));

//app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
    const results = " "
    res.render(path.join(__dirname, "views", "index.ejs"), { results });
    //res.sendFile(path.join(__dirname, "views", "index.html"));
});

app.post("/grabMovies", async (req, res) => {
    const movies = await grabMovies(req.body.year);
    //console.log(movies)
    const results = await generateCSVandTable(movies)

    res.render(path.join(__dirname, "views", "index.ejs"), { results })
});

app.listen(port, () => {
    console.log(`Web server started and running at http://localhost:${port}`);
});


