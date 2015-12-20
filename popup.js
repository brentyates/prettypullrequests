var port;

chrome.tabs.getSelected(null, function(tab) {
    port = chrome.tabs.connect(tab.id, {name: "pullrequest"});
});

function collapse() {
    var path = document.getElementById('path').value;
    port.postMessage({collapse: path});
}

function expand() {
    var path = document.getElementById('path').value;
    port.postMessage({expand: path});
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#collapse').addEventListener('click', collapse);
    document.querySelector('#expand').addEventListener('click', expand);
});

function Node(id, parent, text, icon) {
    this.id = id;
    this.parent = parent || '#';
    this.text = text;
    if (icon) {
        this.icon = icon;
    }
}

function convertPathsToNodes(paths) {
    var nodes = {};
    $.each(paths, function(index, path) {
        var sections = path.split('/');
        var node = new Node(sections[0], '#', sections[0], sections.length > 1 ? undefined : 'jstree-file');
        nodes[node.id] = node;
        if (sections.length == 1) {
            return;
        }

        for (var i = 1; i < sections.length; i++) {
            var id = sections.slice(0, i + 1).join('/');
            var parent = sections.slice(0, i).join('/');
            nodes[id] = new Node(id, parent, sections[i], i == sections.length - 1 ? 'jstree-file' : undefined);
        }
    });
    var i = 0;
    var nodes_flattened = [];
    for (var node in nodes) {
        nodes_flattened[i++] = nodes[node];
    }

    return nodes_flattened;
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {getPaths: true}, function(response) {
        if (response.paths) {
            var nodes = convertPathsToNodes(response.paths);
            $('#tree').jstree({
                'core' : {
                    'data' : nodes,
                    'animation': 0,
                    'themes' : {
                        'responsive' : false,
                        'variant' : 'small'
                    }
                },
                "plugins" : [ "wholerow", "contextmenu" ],
                "contextmenu": {
                    "items": function ($node) {
                        var items = {
                            "Collapse": {
                                "label": "Collapse Diff",
                                "action": function (obj) {
                                    port.postMessage({collapse: '^' + $node.id});
                                }
                            },
                            "Expand": {
                                "label": "Expand Diff",
                                "action": function (obj) {
                                    port.postMessage({expand: '^' + $node.id});
                                }
                            },
                            "Goto": {
                                "label": "Jump to Diff",
                                "action": function(obj) {
                                    port.postMessage({goto: $node.id});
                                }
                            }
                        };

                        if ($node.icon != 'jstree-file') {
                            delete items.Goto;
                        }

                        return items;
                    }
                }
            }).on("select_node.jstree", function (e, data) {
                return data.instance.toggle_node(data.node);
            });
        }
    });
});
