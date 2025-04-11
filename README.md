# Fetch MCP Server

A Model Context Protocol (MCP) server implementation with web content fetching capabilities, enabling server-sent events (SSE) based communication.

## Overview

Fetch MCP Server provides a Model Context Protocol implementation that allows for real-time communication using Server-Sent Events (SSE). It features web content fetching and search capabilities, designed to work with AI applications and provides a standardized way of managing and communicating with models and resources.

## Features

- Model Context Protocol (MCP) implementation
- Server-Sent Events (SSE) for real-time communication
- Web content fetching with Playwright
- Google search capability with SERP results
- HTML to Markdown conversion
- Resource templating and management

## Prerequisites

- Node.js (v14 or higher recommended)
- Yarn package manager
- Kubernetes cluster (for deployment)

## Installation

Clone the repository and install dependencies:

```bash
git clone git@github.com:pnparadise/fetch-mcp-server.git
cd fetch-mcp-server
yarn install
```

## Usage

### Starting the Server

To start the server in development mode:

```bash
yarn dev
```

This will run the server with the MCP inspector for debugging.

![dev-ss](./public/dev-ss.png)

To start the server in production mode:

```bash
yarn start
```

By default, the server runs on port 3001. You can override this by setting the `PORT` environment variable:

```bash
PORT=5000 yarn start
```

### Endpoints

- `/sse` - SSE endpoint for establishing persistent connections
- `/messages` - Endpoint for sending messages to the MCP server

### Available Tools

- `fetchUrls` - Fetch multiple URLs and convert their content to markdown
- `search` - Search and retrieve content from web pages with SERP results

## Project Structure

- `src/index.ts` - Main entry point of the application
- `src/mcp-server.ts` - Implementation of the MCP server and tool definitions
- `src/sse-server.ts` - SSE server implementation using Express
- `k8s/` - Kubernetes deployment configurations

## Dependencies

- [@modelcontextprotocol/sdk](https://www.npmjs.com/package/@modelcontextprotocol/sdk) - SDK for Model Context Protocol
- [Express](https://expressjs.com/) - Web framework for Node.js
- [Playwright](https://playwright.dev/) - Browser automation library
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown converter
