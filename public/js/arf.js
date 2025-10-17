document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('main-content');
    if (!container) return;

    var margin = {top: 20, right: 120, bottom: 20, left: 120};
    var width = container.offsetWidth - margin.right - margin.left;
    var height = container.offsetHeight - margin.top - margin.bottom;
    
    var i = 0, duration = 500, root;

    var tree = d3.layout.tree().size([height, width]);

    var diagonal = d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; });

    var zoomListener = d3.behavior.zoom()
        .scaleExtent([0.1, 2])
        .on("zoom", function() {
            svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        });

    var svgContainer = d3.select("#main-content").append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .call(zoomListener);
    var svg = svgContainer.append("g");

zoomListener.translate([margin.left, margin.top]).event(svgContainer);

    d3.json("arf.json", function(error, json) {
    if (error) return console.error("Erro ao carregar o arf.json:", error);
    root = json;
    root.x0 = 0;
    root.y0 = 0;

    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d.children.forEach(collapse);
            d.children = null;
        }
    }

    if (root.children) {
        root.children.forEach(collapse);
    }
    
    update(root);
});

function update(source) {
    var nodes = tree.nodes(root).reverse();
    var links = tree.links(nodes);

    nodes.forEach(function(d) { d.y = d.depth * 200; });

    var node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    var nodeEnter = node.enter().append("g")
        .attr("class", "node")
        .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")")
        .on("click", click);

    nodeEnter.append("circle").attr("r", 1e-6);
    nodeEnter.append("text")
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("circle")
        .attr("r", 6)
        .style("fill", function(d) { return d._children ? "var(--primary-glow)" : "var(--sidebar-bg-light)"; });

    nodeUpdate.select("text").style("fill-opacity", 1);

    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", "translate(" + source.y + "," + source.x + ")")
        .remove();
    nodeExit.select("circle").attr("r", 1e-6);
    nodeExit.select("text").style("fill-opacity", 1e-6);

    var link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function() {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });

    link.transition().duration(duration).attr("d", diagonal);

    link.exit().transition()
        .duration(duration)
        .attr("d", function() {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();

    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function click(d) {
    var detailsPanel = d3.select(".details-panel");
    var detailsContent = document.getElementById('details-content');

    if (detailsContent) {
        var htmlContent = '<h3>' + d.name + '</h3>';
        if (d.description) { htmlContent += '<p>' + d.description + '</p>'; }
        htmlContent += '<p><strong>Tipo:</strong> ' + (d.url ? 'link' : 'folder') + '</p>';
        if (d.url) { htmlContent += '<p><strong>URL:</strong> <a href="' + d.url + '" target="_blank">' + d.url + '</a></p>'; }
        detailsContent.innerHTML = htmlContent;
        detailsPanel.classed("visible", true); // Torna o painel visível
    }

    if (d.url) return;
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
    update(d);
}
    
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        document.body.classList.toggle("light-mode", !themeToggle.checked);
        themeToggle.addEventListener('change', function() {
            document.body.classList.toggle("light-mode", !this.checked);
        });
    }
    
    var searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            var searchTerm = this.value.toLowerCase();
            d3.selectAll(".node")
                .classed("search-match", function(d) { return searchTerm && d.name.toLowerCase().includes(searchTerm); })
                .classed("search-no-match", function(d) { return searchTerm && !d.name.toLowerCase().includes(searchTerm); });
        });
    }
});
var closeBtn = document.getElementById("close-details-btn");
if (closeBtn) {
    closeBtn.addEventListener('click', function() {
        d3.select(".details-panel").classed("visible", false); // Esconde o painel
    });
}