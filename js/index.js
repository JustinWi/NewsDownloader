// This code generates a "Raw Searcher" to handle search queries. The Raw
// Searcher requires you to handle and draw the search results manually.
google.load('search', '1');

var newsSearch;
var downloadModal = false;

// Update these values to determine how many states and/or cities are searched for news
const STATE_MAX = 0; // don't look in any states
const CITIES_MAX = 10; // look in the top 10 largest cities

const cities = ["Melbourne, Australia",
 		"Sydney, Australia", "Queensland, Australia",

];

	const states = [ "VIC", "QLD", "NSW", ];

var stateNdx = -1;
var cityNdx = -1;
var query;
var articlesFound;
var complete = false;

function searchComplete() {
	// Check that we got results
	if (cityNdx == 0 && stateNdx == 0 && (newsSearch.results == null || (newsSearch.cursor == null && newsSearch.results.length == 0)))
	{
		// No results found
		return;
	}

	for ( var i = 0; i < newsSearch.results.length; i++)
	{
		if (!articlesFound.hasOwnProperty(newsSearch.results[i].unescapedUrl))
		{
			// only add newly discovered articles
			articlesFound[newsSearch.results[i].unescapedUrl] = "";

			// Create HTML elements for search results
			var row = document.createElement('tr');
			var urlCol = document.createElement('td');
			var titleCol = document.createElement('td');
			var contentCol = document.createElement('td');
			var stateCol = document.createElement('td');

			var p = document.createElement('p');
			var a = document.createElement('a');
			var p2 = document.createElement('p');

			a.href = newsSearch.results[i].unescapedUrl;
			a.innerHTML = newsSearch.results[i].unescapedUrl;
			a.target = "_blank";
			urlCol.appendChild(a);

			titleCol.innerHTML = cleanUpStrings(newsSearch.results[i].title);
			contentCol.innerHTML = cleanUpStrings(newsSearch.results[i].content);

			if (stateNdx >= 0 && stateNdx < STATE_MAX) {
				stateCol.innerHTML = states[stateNdx] + " stateNdx: " + stateNdx;
			} else if (stateNdx + 1 >= STATE_MAX && cityNdx >= 0 && cityNdx < CITIES_MAX) {
				stateCol.innerHTML = cities[cityNdx] + " cityNdx: " + cityNdx;
			}
			else
			{
				stateCol.innerHTML = "World wide";
			}

			row.appendChild(urlCol);
			row.appendChild(titleCol);
			row.appendChild(contentCol);
			row.appendChild(stateCol);

			$('#results-table').append(row);
		}
	}

	if (newsSearch.cursor != null && newsSearch.cursor.currentPageIndex + 1 < newsSearch.cursor.pages.length)
	{
		newsSearch.gotoPage(newsSearch.cursor.currentPageIndex + 1);
	}
	else if (stateNdx + 1 < STATE_MAX)
	{
		updateProgress();

		newsSearch.setQueryAddition('');
		newsSearch.setQueryAddition('"' + states[++stateNdx] + '"');
		newsSearch.execute(query);
	}
	else if (cityNdx + 1 < CITIES_MAX)
	{
		updateProgress();

		newsSearch.setQueryAddition('');
		newsSearch.setQueryAddition(cities[++cityNdx]);
		newsSearch.execute(query);
	}
	else
	{
		// all done
		updateProgress();
	}
}

function cleanUpStrings(str) {
	// mTurk doesn't like unicode characters in our CSVs - removing them.
	str = str.replace(/[\u0080-\uF8FF]/g, '');
	str = str.replace(/&quot;/g, '')

	return str;
}

function updateProgress() {
	// ndx's start off at -1
	var progress = Math.round((stateNdx + cityNdx + 3) / (STATE_MAX + CITIES_MAX + 1) * 100);

	setProgress(progress);
}

function resetProgress() {
	$("#progress-container").addClass("active");
	$("#progress-container").addClass("progress-striped");
	$("#progress-container").css('cursor', 'wait');

	$("#progress-bar").removeClass("btn");
	$("#progress-bar").removeClass("btn-primary");

	$("#progress-bar").unbind('click');
	$("#progress-bar").text('Loading articles...');

	$("#download-link").attr('href', null);
	$("#download-link").attr('download', null);

	setProgress(5);
	complete = false;
}

function setProgress(progress) {
	$("#progress-bar").attr("aria-valuetransitiongoal", progress);
	$('.progress .progress-bar').progressbar();
}

function progressComplete()
{
	complete = true;
	totalArticles = Object.keys(articlesFound).length;

	$("#progress-container").removeClass("active");
	$("#progress-container").removeClass("progress-striped");

	if (totalArticles > 0)
	{
		$("#download-link").attr('href', getCsvUrl());
		$("#download-link").attr('download', getCsvName());

		$("#progress-bar").html('Found ' + totalArticles + ' "' + query + '" articles. Click to download.');
		$("#progress-bar").addClass("btn");
		$("#progress-bar").addClass("btn-primary");

		$("#progress-bar").click(function() {downloadDialog();});

		$("#progress-container").css('cursor', 'pointer');
	}
	else
	{
		$("#progress-bar").html('No articles found');
		$("#progress-container").css('cursor', 'auto');
	}

	_gaq.push(['_trackEvent', "News Search", "Search ended", "Query", query]);
	_gaq.push(['_trackEvent', "News Search", "Search ended", "Results", totalArticles]);
}

function subscriptionCookieExists() {
	return $.cookie('cdl_news_hack') != null;
}

function openDialog(title, header, cancel, confirm) {
	if (subscriptionCookieExists()) {
		if (downloadModal) {
			$("#download-link").show();
		}
		return;
	}

	if (title) {
		$("#myModalTitle").html(title);
	}

	$('#subscribeModal').modal({
		backdrop: 'static',
		keyboard: false
	});

	// bootbox.dialog({
	// 	  message: "<b>We do this stuff all the time.</b><p/>Subscribe to the <a href='http://customerdevlabs.com' target='_blank'>Customer Dev Labs</a> blog, or follow us on Twitter so you hear about the next one.",
	// 	  title: "<h2 style='text-align:center'>Like this hack?</h2>",
	// 	  buttons: {
	// 	    success: {
	// 	      label: "Subscribe via Email",
	// 	      className: "btn-success",
	// 	      callback: function() {
	// 	    	  window.open('http://feedburner.google.com/fb/a/mailverify?uri=CustomerDevLabs&loc=en_US');
	// 	      }
	// 	    },
	// 	    danger: {
	// 	      label: "Subscribe via RSS",
	// 	      className: "btn-danger",
	// 	      callback: function() {
	// 	    	  window.open('http://feeds.feedburner.com/CustomerDevLabs');
	// 	      }
	// 	    },
	// 	    main: {
	// 	      label: "Follow on Twitter",
	// 	      className: "btn-primary",
	// 	      callback: function() {
	// 	    	  window.open('https://twitter.com/intent/user?screen_name=CustomerDevLabs');
	// 	      }
	// 	    }
	// 	  }
	// 	});

	_gaq.push(['_trackEvent', "News Search", "File downloaded", "Query", query]);
}

function getCsvUrl() {
    var csv = $("#results-table").table2CSV({delivery:'value'});
    return 'data:text/csv;charset=ASCII,' + encodeURIComponent(csv);
}

function getCsvName() {
	return query.trim().split(' ').join('_') + '_articles.csv';
}

function searchDialog() {
	downloadModal = false;
	openDialog("Searching! While we wait...");
}

function downloadDialog() {
	downloadModal = true;
	openDialog("Get your Results Plus...");
}

function fireAway() {
	$("#download-link").hide();
	searchDialog();

	// Clear results table
	$("#results-table").find("tr:gt(0)").remove();

	// Create a News Search instance.
	newsSearch = new google.search.NewsSearch();

	// Set searchComplete as the callback function when a search is
	// complete. The newsSearch object will have results in it.
	newsSearch.setSearchCompleteCallback(this, searchComplete, null);

	newsSearch.setResultSetSize(8);

	stateNdx = -1;
	cityNdx = -1;
	query = $("#news-search").val();
	articlesFound = {};
	resetProgress();

	_gaq.push(['_trackEvent', "News Search", "Search started", "Query", query]);

	// Specify search quer(ies)
	newsSearch.execute(query);
}

$(document).ready(function() {
	$("#search-button").click(function() {
		fireAway();
	});

	$('.progress .progress-bar').progressbar({
		done: function() {
			var progress = $("#progress-bar").attr("aria-valuetransitiongoal");

			if (progress != null && progress >= 100 && !complete)
			{
				progressComplete();
			}
		}
	});

	$('#sharing').share({
		networks: ['twitter','googleplus','facebook','linkedin'],
		urlToShare: 'http://wp.me/p2pmCq-gA'
	});

  (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
  (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
  m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
  })(window,document,'script','//www.google-analytics.com/analytics.js','ga');

  ga('create', 'UA-44161122-1', 'customerdevlabs.com');
  ga('send', 'pageview');

	$('#news-search').keypress(function (e) {
		  if (e.which == 13) {
		    $('#search-button').click();
		  }
		});

	$('#mc-form').ajaxChimp({
		url: 'http://CustomerDevLabs.us6.list-manage.com/subscribe/post?u=7de22f15c9e97df7b49df664f&id=25f38c75ad&group%5B10121%5D%5B128%5D=128',
		callback: function(resp) {
			if (resp.result === 'success' || resp.msg.indexOf("already") >= 0) {
				$("#subscribeModal").modal('hide');

				if (resp.result === 'success') {
					_gaq.push(['_trackEvent', "New Subscriber", "New Subscriber", "Email", $('#mc-email').val()]);

					$(document).trigger("add-alerts", {
					  message: "Success! Check your inbox and confirm your subscription to get the next hack.",
					  priority: "success"
					});
				}

				$.cookie('cdl_news_hack', 'true');

				if (downloadModal) {
					$("#download-link").show();
					// $.fileDownload(getCsvUrl())
				  //   .done(function () { alert('File download a success!'); })
				  //   .fail(function () { alert('File download failed!'); });
				}
			}
		}
	});

	$('#subscribeButton').click(function() {
		$('#mc-form').submit();
	});

	$('#subscribeModal').on('shown.bs.modal', function () {
    $('#mc-email').focus();
		$("#downloadCanceled").hide();
	});

	$('#subscribeModal').on('hidden.bs.modal', function () {
		if (!subscriptionCookieExists() && downloadModal) {
			$("#downloadCanceled").show();
		}
	});
});
