---
title: Fast Web Sites with JAM
date: "2020-01-22T14:12:03.284Z"
description: "Thoughts about making fast content driven sites"
---

In the past it was part of my job to make web pages appear and be usable quickly. Even with a relatively
slow web server (for example, > 100ms response times), the frontend typically is the dominant
performance cost. No surprise if the frontend is taking > 90% of the time before the page is usable or
even visible. Making the backend systems super fast won't necessarily make your website users any happier.

A lot of "content" driven websites (which I'm going to think of as a bunch of templates with content injected
into them) come with a content management system "CMS". The point of these is to let users create the content
without being experts in the underlying technology. [Wordpress](https://wordpress.com) is an example of this,
users can create websites with blog posts just by choosing a template and then editing a post in the browser,
probably with a (maybe live) preview of what the end result will look like. Wordpress and Drupal get mentioned
a lot as tools for making content driven websites. I have used Wordpress and I find the whole backend setup slow and
a bit unpleasant (maybe because there's a bunch of reasons to dislike PHP programming).

What else is there for websites that are not completely bespoke though? Static site generators have been
somewhat cool for a while, at least with power users / software technology types. [Jekyll](https://jekyllrb.com/)
was the first really popular static site generator and used for many tech blogs.

I've tried [Hugo](https://gohugo.io/)
for building this web site and it's a good choice for many, just not as interestingly performance obsessive as
[GatsbyJS](https://www.gatsbyjs.org/) that I'm actually using. Gatsby could be called a web(site) compiler, given
all the optimizations that it makes. 10 years ago, there were rather a lot of tips to read from Google and Yahoo about
how to speed up your webpages. These days it's more complicated as is evidenced by the length of this
[Front-End Performance Checklist](https://www.smashingmagazine.com/2020/01/front-end-performance-checklist-2020-pdf-pages/) and it's becoming an inefficient use of developers' time to hand
optimize websites.

Anyway, as the name suggests SSGs generate site content that can be served directly without any dynamic page generation. Fast and no PHP security issues. Most sites these days want more than completely static sites, and indeed SSGs do have ways
to put some Javascript etc. into their pages. Taking this further we have JAM, now marketed as [JamStack](https://jamstack.org/):

> Fast and secure sites and apps delivered by pre-rendering files and serving them directly from a CDN, removing the requirement to manage or run web servers.

Now we don't even need a server. The *J*avscript calling *A*pis takes care of the dynamic parts of the page.
The *M*arkup bit is about generating the content from data, such as markdown in simple text files, or any data source.
What about the average end user though? Tools like [Netlify CMS](https://www.netlifycms.org/) can present users the
same sort of interface that an edit page on Wordpress has, for example. The content can be processed by the
JAMStack and turned into a static site with dynamic features supported by modern Javascript frameworks such as [React](https://reactjs.org/) that developers are familiar with.

I'd be looking at JAMStack if I wanted to deliver a fast secure website.
