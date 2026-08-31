---
layout: page
title: education
permalink: /education/
nav: true
nav_order: 4
nav_anchor: /#education
---

{% assign entry = site.data.cv | where: "title", "Education" | first %}
<div class="cv">
  <div class="card mt-3 p-3">
    <h3 class="card-title font-weight-medium">Education</h3>
    <div>{% include cv/time_table.liquid %}</div>
  </div>
</div>
