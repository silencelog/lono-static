'use strict'

/**
 * Module dependencies.
 */

import KoaSend from 'koa-send'
const debug = require('debug')('lono-static')
const { resolve } = require('path')
const assert = require('assert')

class Static {
  constructor (path, opts) {
    opts = Object.assign(Object.create(null), opts)
    assert(path, 'path directory is required to serve files')
    debug('static "%s" %j', path, opts)
    opts.path = resolve(path)
    this.isLono = true
    this.opt = opts
  }
  install (app) {
    const opts = (app.$config && app.$config.static) || this.opt
    opts.root = opts.path
    if (!opts.defer) {
      return async function serve (ctx, next) {
        let done = false

        if (ctx.method === 'HEAD' || ctx.method === 'GET') {
          try {
            done = await KoaSend(ctx, ctx.path, opts)
          } catch (err) {
            if (err.status !== 404) {
              throw err
            }
          }
        }

        if (!done) {
          await next()
        }
      }
    }
    return async function serve (ctx, next) {
      await next()

      if (ctx.method !== 'HEAD' && ctx.method !== 'GET') return
      // response is already handled
      if (ctx.body != null || ctx.status !== 404) return // eslint-disable-line

      try {
        await KoaSend(ctx, ctx.path, opts)
      } catch (err) {
        if (err.status !== 404) {
          throw err
        }
      }
    }
  }
}

export default function (...agr) {
  return new Static(...agr)
}
