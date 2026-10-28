# Composite Components in React Native

This project uses a lot of reusable UI pieces that are built from simpler React Native components. These are called composite components.

## What is a composite component?

A composite component is a custom component made by combining basic components like:

- View
- Text
- Image
- ScrollView
- FlatList
- Button

Instead of writing the same structure again and again, developers create a component and reuse it.

## Example from this app

In this project, many components are custom wrappers around the basic ones.

### 1. ThemedView

This is a custom component that behaves like a View, but it can automatically use the current theme color.

Think of it as:

- regular View + theme awareness

```tsx
<ThemedView style={styles.container}>
  <Text>Hello</Text>
</ThemedView>
```

This is easier than manually checking light/dark mode everywhere.

### 2. ThemedText

This is a custom Text component that follows the app theme.

Think of it as:

- regular Text + styling rules for the app design

```tsx
<ThemedText type="title">Welcome to Expo</ThemedText>
```

### 3. HintRow

This is a custom row made from a layout of text pieces.

It likely combines:

- a label on the left
- a hint or description on the right

This is a good example of composition:

```tsx
<HintRow
  title="Try editing"
  hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
/>
```

### 4. NativeTabs

This is a special navigation component for mobile apps.

It is not a basic built-in element like View or Text, but a more advanced component used for tab navigation.

```tsx
<NativeTabs>
  <NativeTabs.Trigger name="index" />
  <NativeTabs.Trigger name="explore" />
</NativeTabs>
```

It is still built from smaller pieces, but it gives a tab bar experience.

### 5. AnimatedIcon

This is a custom animated element.

It may internally use animations and other pieces, but from the outside it behaves like a reusable visual component.

```tsx
<AnimatedIcon />
```

## Why composite components are useful

Composite components help because they:

- reduce repeated code
- keep styling consistent
- make the app easier to maintain
- separate layout from logic
- make screens cleaner and simpler

## The main idea

When you see a component like `ThemedView`, `HintRow`, or `NativeTabs`, do not think of it as a completely different concept.

Instead, think:

- it is a custom component made from smaller pieces
- it is designed for a specific purpose
- it helps organize the app

## Beginner-friendly summary

Basic components:

- View
- Text
- Image
- ScrollView
- FlatList
- Button

Composite components:

- ThemedView
- ThemedText
- HintRow
- NativeTabs
- AnimatedIcon
- WebBadge

These are all still React Native UI components, just more specialized and reusable.

## Simple rule to remember

If a component name sounds advanced, ask:

- what is it made of?
- is it wrapping a basic component?
- is it organizing UI for reuse?

Usually the answer is: it is a composite component built from simpler parts.

## Final takeaway

This project is a good example of how real React Native apps are built:

- start with basic components
- create custom reusable pieces
- combine them into screens and navigation

That is the core idea behind composite components.

<collapsible>