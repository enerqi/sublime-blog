/**
 * Bio component that queries for data
 * with Gatsby's useStaticQuery component
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import React from "react"
import {
  useStaticQuery,
  graphql
} from "gatsby"
import Image from "gatsby-image"
import { Link } from "gatsby"

import {
  rhythm
} from "../utils/typography"

import githubMarkUrl, { ReactComponent as GithubMarkIcon } from '../../content/assets/github-mark.svg'

const GithubMark = () => (
  <a href="https://github.com/enerqi">
    <img src={githubMarkUrl} alt="github mark"/>
  </a>
)


const Bio = () => {
  const data = useStaticQuery(graphql `
    query BioQuery {
      avatar: file(absolutePath: { regex: "/profile-pic.jpg/" }) {
        childImageSharp {
          fixed(width: 50, height: 50) {
            ...GatsbyImageSharpFixed
          }
        }
      }
      site {
        siteMetadata {
          author
          social {
            twitter
          }
        }
      }
    }
  `)

  const {
    author,
    social
  } = data.site.siteMetadata
  return ( <
      div style = {
        {
          display: `flex`,
          marginBottom: rhythm(2.5),
        }
      } >

      <Link to={"/"}>
      <
      Image fixed = {
        data.avatar.childImageSharp.fixed
      }
      alt = {
        author
      }
      style = {
        {
          marginRight: rhythm(1 / 2),
          marginBottom: 0,
          minWidth: 50,
          borderRadius: `100%`,
        }
      }
      imgStyle = {
        {
          borderRadius: `50%`,
        }
      }
      />
      </Link>

      <p>
      Notes from a software engineer with two decades working in various industries - games, poker and gambling,
      music streaming and telecommunications. Likes fast code and functional programming. Based in the UK.
      </p>
      <GithubMark/>
    </div>
)
}

export default Bio
