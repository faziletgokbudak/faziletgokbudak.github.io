---
layout: page
title: experience
permalink: /experience/
nav: true
nav_order: 3
nav_anchor: /#experience
---

{% assign entry = site.data.cv | where: "title", "Experience" | first %}
<div class="cv">
  <div class="card mt-3 p-3">
    <h3 class="card-title font-weight-medium">Experience</h3>
    <div>{% include cv/time_table.liquid %}</div>
  </div>
</div>
