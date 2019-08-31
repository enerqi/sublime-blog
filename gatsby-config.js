module.exports = {
  siteMetadata: {
    title: `Sublime Blog`,
    author: `Enerqi`,
    description: `Software, Programming, Tech`,
    siteUrl: `https://blog.sublime.is/`,
    social: {
      twitter: "none",
      github: `https://github.com/enerqi`,
    },
  },
  plugins: [{
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/blog`,
        name: `blog`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        path: `${__dirname}/content/assets`,
        name: `assets`,
      },
    },
    'gatsby-plugin-svgr',
    {
      resolve: `gatsby-transformer-remark`,
      options: {
        plugins: [{
            resolve: `gatsby-remark-images`,
            options: {
              maxWidth: 590,
            },
          },
          {
            resolve: `gatsby-remark-responsive-iframe`,
            options: {
              wrapperStyle: `margin-bottom: 1.0725rem`,
            },
          },
          `gatsby-remark-prismjs`,
          `gatsby-remark-copy-linked-files`,
          `gatsby-remark-smartypants`,
        ],
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    //{
    //resolve: `gatsby-plugin-google-analytics`,
    //options: {
    //trackingId: `ADD YOUR TRACKING ID HERE`,
    //},
    //},
    `gatsby-plugin-feed`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Sublime Blog`,
        short_name: `Sublime Blog`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#ffffff`,
        display: `standalone`,
        legacy: false,  // removed legacy apple-touch-icon shortcut links (bandwidth heavy) - just use web manifest icons
        icon: `src/images/quasar-square.jpg`
      },
    },
    `gatsby-plugin-offline`,
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-plugin-typography`,
      options: {
        pathToConfigModule: `src/utils/typography`,
        omitGoogleFont: true,  // want to self host using `typefaces` library
      },
    },
  ],
}
