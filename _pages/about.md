---
layout: about
title: about
permalink: /
subtitle: Research Associate at Cambridge University
cover_image: cover_photo.JPG

profile:
  align: right
  image: profile_pic3.jpg
  image_circular: true # crops the image to make it circular
  more_info: >
    

[comment]: <> (    <p>Apple Research</p>)

[comment]: <> (    <p>Cambridge, UK</p>)

relight_medallion: sunset # profile photo in a cursor-lit orb, tinted to match the sunset cover; options: sunset|glass|frosted|chrome|gold|crystal|water|holo|amber (or 'demo' for the switcher); remove to disable
news: true # includes a list of news items
selected_papers: false # includes a list of papers marked as "selected={true}"
social: true # includes social icons at the bottom of the page
---

Hello, welcome to my website! 

**Research:** I am currently a postdoctoral researcher at the University of Cambridge, working on visual computing, 3D computer vision, and machine learning. My research interests span generative models, 3D scene representations, and computational photography, with the aim of building photorealistic digital twins and worlds. During my PhD, I worked in the Computer Laboratory under Prof. Cengiz Öztireli, developing machine learning algorithms for image editing and material representations.

**Industry:** Before returning to Cambridge, I spent nearly 2 years at Apple, developing generative AI features for iPhone cameras 📸, including end-to-end GenAI frameworks and dataset pipelines for image editing tasks. During my PhD, I also interned at Amazon, working with GANs on a conditional image generation task.

Outside of work, I volunteer with Women in CS initiatives and enjoy photography, running, and swimming.

I love working on research problems with product-level impact, and I'm always happy to discuss research scientist/engineering roles. Feel free to reach out!

<h2 id="research" style="scroll-margin-top: 5rem;">research</h2>

A few selected publications are below — see the <a href="{{ '/publications/' | relative_url }}">full list</a> for everything.

{% include selected_papers.liquid %}

<div class="cv">
  {% assign experience = site.data.cv | where: "title", "Experience" | first %}
  <div id="experience" class="card mt-3 p-3" style="scroll-margin-top: 5rem;">
    <h3 class="card-title font-weight-medium">Industry experience</h3>
    <div>
      <ul class="card-text font-weight-light list-group list-group-flush">
        {% for content in experience.contents %}
          {% if content.institution contains 'Apple' or content.institution contains 'Amazon' %}
            <li class="list-group-item">
              <div class="row">
                <div class="col-xs-2 cl-sm-2 col-md-2 text-center" style="width: 75px">
                  <span class="badge font-weight-bold danger-color-dark text-uppercase align-middle" style="min-width: 75px">{{ content.year }}</span>
                </div>
                <div class="col-xs-10 cl-sm-10 col-md-10 mt-2 mt-md-0">
                  <h6 class="title font-weight-bold ml-1 ml-md-4">{{ content.title }}</h6>
                  <table class="table-cv ml-1 ml-md-4 institution">
                    <tbody>
                      <tr>
                        <td style="vertical-align: top; text-align: center" class="institution"><i class="fa-solid fa-building-columns iconinstitution"></i></td>
                        <td class="institution">{{ content.institution }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <ul class="items">
                    {% for item in content.description %}<li><span class="item">{{ item }}</span></li>{% endfor %}
                  </ul>
                </div>
              </div>
            </li>
          {% endif %}
        {% endfor %}
      </ul>
    </div>
  </div>

  {% assign education = site.data.cv | where: "title", "Education" | first %}
  <div id="education" class="card mt-3 p-3" style="scroll-margin-top: 5rem;">
    <h3 class="card-title font-weight-medium">Education</h3>
    <div>
      <ul class="card-text font-weight-light list-group list-group-flush">
        {% for content in education.contents %}
          <li class="list-group-item">
            <div class="row">
              <div class="col-xs-2 cl-sm-2 col-md-2 text-center" style="width: 75px">
                <span class="badge font-weight-bold danger-color-dark text-uppercase align-middle" style="min-width: 75px">{{ content.year }}</span>
              </div>
              <div class="col-xs-10 cl-sm-10 col-md-10 mt-2 mt-md-0">
                <h6 class="title font-weight-bold ml-1 ml-md-4">{{ content.title }}{% if content.institution %}, {{ content.institution }}{% endif %}</h6>
                {% if content.description %}
                  <ul class="items">
                    {% for item in content.description %}<li><span class="item">{{ item }}</span></li>{% endfor %}
                  </ul>
                {% endif %}
              </div>
            </div>
          </li>
        {% endfor %}
      </ul>
    </div>
  </div>
</div>