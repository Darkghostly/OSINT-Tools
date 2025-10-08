document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('main-content');
    if (!container) return;

    var width = container.offsetWidth;
    var height = container.offsetHeight;
    
    var i = 0, duration = 500, root;

    var tree = d3.layout.tree()
        .size([180, height / 2.5]) 
        .separation(function(a, b) { return (a.parent === b.parent ? 1 : 2) / (a.depth || 1); });

    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 0 * Math.PI]; });

    // --- CONFIGURAÇÃO CORRETA DO ZOOM E PAN ---
    var svg = d3.select("#main-content").append("svg")
        .attr("width", width)
        .attr("height", height)
        .call(d3.behavior.zoom().scaleExtent([0.1, 3]).on("zoom", function() {
            vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        }))
      .append("g"); // Adiciona o grupo principal aqui

    // O grupo 'vis' é o que será movido pelo zoom/pan
    var vis = svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

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

        nodes.forEach(function(d) { d.y = d.depth * 180; });

        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        var nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", "rotate(" + (source.x0 - 90) + ")translate(" + source.y0 + ")")
            .on("click", click);

        nodeEnter.append("circle").attr("r", 1e-6);

        nodeEnter.append("text")
            .text(function(d) { return d.name; })
            .style("fill-opacity", 1e-6);

        var nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });

        nodeUpdate.select("circle")
            .attr("r", 6)
            .style("fill", function(d) { return d._children ? "var(--primary-glow)" : "var(--node-fill-color, var(--bg-dark))"; });
        
        nodeUpdate.select("text")
            .style("fill-opacity", 1)
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("x", function(d) { return d.x < 180 ? 10 : -10; })
            .attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
            .attr("dy", ".35em");

        var nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", "rotate(" + (source.x - 90) + ")translate(" + source.y + ")")
            .remove();

        nodeExit.select("circle").attr("r", 1e-6);
        nodeExit.select("text").style("fill-opacity", 1e-6);

        var link = vis.selectAll("path.link")
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
        if (d.url) {
            window.open(d.url, '_blank');
            return;
        }
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }
    
    // --- FUNCIONALIDADES DA SIDEBAR ---
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