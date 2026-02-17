# Spec: Uptime monitoring/alerting app

## Purpose
The purpose of this app is to provide simple monitoring and alerting for web sites. If your web site goes down, you should find out immediately from an automated monitor, not randomly when someone emails you or a teammate notifies you in Slack.

## Overview
The core idea is to have a number of URLs that are checked for proper functioning, or other simple automated checks/tests that can be run continually against production. E.g., if you own https://example.com, then a cron job wakes up every 5 minutes and tries to load that URL. If it's not an HTTP 200 success status code, then an alarm is fired and people are notified via email.

## Scope
This document describes a bare-bones MVP, the simplest thing that could work. Towards the end we'll discuss possible future extensions/improvements.

## Mechanism
In a bit more detail, here's how it works:

* The app has a list of sites. Each has an URL.
* Every 5 minutes, the URL for each site is hit.
* If it doesn't return an HTTP 2xx success code, then an incident is opened.
* When an incident is opened, a notification is sent via email to all contacts.
* Subsequent failing checks don't open new incidents, as long as an incident for that site is already open.
* Incidents can be manually closed/resolved when the user decides they are over. After that, a subsequent failed check would create a new incident and alert/notify again.

## Checks
A check should fail if:
* The server returns anything other than a 2xx code
* The server times out or the connection otherwise fails
* An https URL does not have a valid SSL certificate

## Core concepts
* Site: a website with an URL to hit
* Contact: an email address to send alerts to. When any incident is opened, all contacts are notified.
* Incident: an episode that starts when a site check fails, and is closed manually by the user. An incident belongs to a site, and it has a status.

## Users/auth
The site supports multiple users. New users can only be created by invitation from an existing user. The very first user is seeded directly in the database.

The site is meant to be useful both to logged-in and anonymous users. Without login, it is a read-only status page. When logged in, it allows you to configure monitoring and alerting, close incidents, and invite new users.

## Screens

### Status screen
This is the main screen. It shows:
* A list of open incidents, if any
* A list of sites, along with the status of each (success/failure of the last check, and a timestamp).
* For logged-in users, a way to add/edit/delete sites

### Contacts screen
This shows a list of contacts, with affordances to add/edit/remove them. This entire screen is only accessible to logged-in users.

### Site screen
Each site has a detail page showing:
* the URL
* a history of incidents for this site, with their status and time opened/closed
* a log of the checks that have been performed, with timestamp and result of each

For logged-in users, there is a way to edit the site or delete it.

### Incident screen
Each incident has a detail page showing the site it's for, the failing check that opened it along with the timestamp, and a log of the checks that have happened since that initial one. The status of the incident is displayed.

For logged-in users, there is a way to close the incident if it's open.

## Realtime updates
The status, site, and incident screens should update in real time. The user should not have to refresh in order to be sure they have the latest status of an incident or site.

## Future directions
Some improvements we might make in the future:
* Other contact methods, e.g., SMS, Slack.
* More sophisticated checks. E.g., making sure that certain domains/URLs redirect appropriately to expected targets; configurable intervals.
* Handling of transient check failures. A network problem might be on the client side or server side, it may be transient or not. We may want to alert only after a few consecutive failures of this type (while still alerting immediately on clear failures).
* A more sophisticated data model. E.g., different sites could alert different contacts; contacts could be organized into contact lists; different kinds of checks could be organized under each site, etc.
* A more sophisticated workflow around incidents. Incidents could have an acknowledged state; they could alert until acknowledged; the alerts could escalate in a certain way. There could be written updates entered by the users. Incidents could auto-resolve if the site comes back up. Etc.
* Data retention policies for check logs.

To be clear, these are *future* directions: do not include any of the above in the MVP, and don't design ahead for them. But also, don't create an information architecture in the design, or a technical architecture in the code, that would preclude any of these or make them abnormally difficult.
