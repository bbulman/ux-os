# <Product>: Motion

<!--
UX-OS project file. Delete this comment once the file is filled in.
For: how things move: the feel, the standard values, the patterns allowed, the ones banned, and what happens when someone asks for less motion.
Read by: the animation and loading-states skills, the Design Agent, and any agent writing a transition.
Good looks like: a feel in three words, exact values as tokens, a short pattern list, and a reduced-motion rule. Describe the feeling and the numbers, and let the code do the rest.
-->

## Motion language
<!-- Three words for how motion should feel, each with what it rules out. -->
- **<word>:** <what it means here, and what it rules out>

## Standard values
<!-- Express these as tokens so every component pulls the same numbers. -->
| Token | Value | Use |
|---|---|---|
| <--ease-standard> | <cubic-bezier(...)> | <most transitions> |
| <--duration-fast> | <ms> | <hovers, toggles, small state changes> |
| <--duration-base> | <ms> | <panels, menus, page elements> |
| <--duration-reveal> | <ms> | <entrances, if you use them> |
| <--distance-max> | <px> | <the furthest anything travels> |

## Patterns
<!-- Each pattern you allow: when to use it and its values. Five or fewer is plenty. -->
### <Pattern name>
- **Use for:** <...>
- **Values:** <...>

## Never
<!-- What motion must not do here. -->
- <for example: animate width, height or position properties; bounce functional controls; block input while something animates>

## Reduced motion
<!-- What changes when someone asks the system for less motion. -->

## Stack
<!-- What implements motion here, and what is ruled out. -->
