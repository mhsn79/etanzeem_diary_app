# Tanzeemi Unit Integration

This document explains how to use the new functionality that fetches and manages Tanzeemi Unit data, including the user's assigned unit and the hierarchical structure of units.

## Overview

The implementation adds a new `tanzeemSlice` that fetches Tanzeemi Unit data from the API. It integrates with the `personSlice` to automatically fetch the user's Tanzeemi Unit after fetching their person data. It also provides functionality to fetch and organize units by level, build hierarchies, and find relationships between units.

## Tanzeemi Unit Model

The Tanzeemi Unit model includes the following fields:

```typescript
interface TanzeemiUnit {
  id: number;
  name: string;
  description?: string;
  parent_id?: number | null;
  level?: number;
  level_id?: number | null;
  zaili_unit_hierarchy?: string | null;
  status?: string;
  // ... other fields
}
```

## How It Works

1. When a user logs in, the `login` thunk in `authSlice` automatically dispatches the `fetchPersonByEmail` thunk from `personSlice`.
2. The person data is fetched from the API and stored in the Redux store under `persons.userDetails`.
3. If the person data includes a `Tanzeemi_Unit` or `unit` field, the `fetchUserTanzeemiUnit` thunk from `tanzeemSlice` is automatically dispatched.
4. The Tanzeemi Unit data is fetched from the API and stored in the Redux store under `tanzeem.userUnitDetails`.
5. You can access this data using the `selectUserUnitDetails` selector from `tanzeemSlice`.

## Additional Features

The tanzeemSlice also provides:

1. **Hierarchical Organization**: Units can be organized by level and parent-child relationships
2. **Level-based Filtering**: Fetch units by their level_id
3. **Parent-Child Navigation**: Find parent units or child units of a specific unit
4. **Complete Hierarchy**: Build a complete hierarchy of all units

## Usage Examples

### Basic Usage

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { selectUserDetails } from '@/app/features/persons/personSlice';
import { selectUserUnitDetails, selectUserUnitStatus } from '@/app/features/tanzeem/tanzeemSlice';

const ProfileScreen = () => {
  const userDetails = useSelector(selectUserDetails);
  const userUnitDetails = useSelector(selectUserUnitDetails);
  const userUnitStatus = useSelector(selectUserUnitStatus);

  if (userUnitStatus === 'loading') {
    return <Text>Loading unit details...</Text>;
  }

  return (
    <View>
      <Text>Name: {userDetails?.name}</Text>
      <Text>Email: {userDetails?.email}</Text>
      <Text>Phone: {userDetails?.phone}</Text>
      
      {userUnitDetails ? (
        <View>
          <Text>Tanzeemi Unit: {userUnitDetails.name}</Text>
          <Text>Description: {userUnitDetails.description}</Text>
          <Text>Level: {userUnitDetails.level}</Text>
          <Text>Zaili Unit Hierarchy: {userUnitDetails.zaili_unit_hierarchy}</Text>
          {/* Display other unit details as needed */}
        </View>
      ) : (
        <Text>No unit details available</Text>
      )}
    </View>
  );
};

export default ProfileScreen;
```

### Manually Fetching Tanzeemi Unit Data

If you need to fetch Tanzeemi Unit data manually, you can use the `fetchTanzeemiUnitById` thunk:

```tsx
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTanzeemiUnitById, selectTanzeemiUnitById } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';

const UnitDetailsScreen = ({ unitId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const unitDetails = useSelector(state => selectTanzeemiUnitById(state, unitId));

  useEffect(() => {
    if (unitId) {
      dispatch(fetchTanzeemiUnitById(unitId));
    }
  }, [unitId, dispatch]);

  if (!unitDetails) {
    return <Text>Loading unit details...</Text>;
  }

  return (
    <View>
      <Text>Unit Name: {unitDetails.name}</Text>
      <Text>Description: {unitDetails.description}</Text>
      <Text>Level: {unitDetails.level}</Text>
      <Text>Level ID: {unitDetails.level_id}</Text>
      <Text>Parent ID: {unitDetails.parent_id}</Text>
      <Text>Zaili Unit Hierarchy: {unitDetails.zaili_unit_hierarchy}</Text>
      <Text>Status: {unitDetails.status}</Text>
    </View>
  );
};

export default UnitDetailsScreen;
```

### Fetching Units by Level

To fetch units by level, you can use the `fetchTanzeemiUnitsByLevel` thunk:

```tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTanzeemiUnitsByLevel, selectUnitsByLevelId, selectTanzeemStatus } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';

const UnitsByLevelScreen = ({ levelId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const units = useSelector(state => selectUnitsByLevelId(state, levelId));
  const status = useSelector(selectTanzeemStatus);

  useEffect(() => {
    dispatch(fetchTanzeemiUnitsByLevel(levelId));
  }, [levelId, dispatch]);

  if (status === 'loading') {
    return <Text>Loading units...</Text>;
  }

  return (
    <View>
      <Text>Units for Level {levelId}</Text>
      <FlatList
        data={units}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>Name: {item.name}</Text>
            <Text>Description: {item.description}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default UnitsByLevelScreen;
```

### Working with Unit Hierarchy

To build and navigate the unit hierarchy:

```tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchUnitHierarchy, 
  selectParentUnit, 
  selectChildUnits,
  selectTanzeemiUnitById,
  selectHierarchyStatus
} from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';

const UnitHierarchyScreen = ({ initialUnitId }) => {
  const dispatch = useDispatch<AppDispatch>();
  const [currentUnitId, setCurrentUnitId] = useState(initialUnitId);
  const currentUnit = useSelector(state => selectTanzeemiUnitById(state, currentUnitId));
  const parentUnit = useSelector(state => selectParentUnit(state, currentUnitId));
  const childUnits = useSelector(state => selectChildUnits(state, currentUnitId));
  const hierarchyStatus = useSelector(selectHierarchyStatus);

  useEffect(() => {
    dispatch(fetchUnitHierarchy());
  }, [dispatch]);

  if (hierarchyStatus === 'loading') {
    return <Text>Loading unit hierarchy...</Text>;
  }

  if (!currentUnit) {
    return <Text>Unit not found</Text>;
  }

  const navigateToParent = () => {
    if (parentUnit) {
      setCurrentUnitId(parentUnit.id);
    }
  };

  const navigateToChild = (childId) => {
    setCurrentUnitId(childId);
  };

  return (
    <View>
      <Text>Current Unit: {currentUnit.name}</Text>
      
      {parentUnit && (
        <TouchableOpacity onPress={navigateToParent}>
          <Text>Parent Unit: {parentUnit.name}</Text>
        </TouchableOpacity>
      )}
      
      <Text>Child Units:</Text>
      <FlatList
        data={childUnits}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => navigateToChild(item.id)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text>No child units</Text>}
      />
    </View>
  );
};

export default UnitHierarchyScreen;
```

### Fetching All Tanzeemi Units

To fetch all Tanzeemi Units, you can use the `fetchTanzeemiUnits` thunk:

```tsx
import React, { useEffect } from 'react';
import { View, Text, FlatList } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTanzeemiUnits, selectAllTanzeemiUnits, selectTanzeemStatus } from '@/app/features/tanzeem/tanzeemSlice';
import { AppDispatch } from '@/app/store';

const AllUnitsScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const units = useSelector(selectAllTanzeemiUnits);
  const status = useSelector(selectTanzeemStatus);

  useEffect(() => {
    if (status === 'idle') {
      dispatch(fetchTanzeemiUnits());
    }
  }, [status, dispatch]);

  if (status === 'loading') {
    return <Text>Loading units...</Text>;
  }

  return (
    <View>
      <Text>All Tanzeemi Units</Text>
      <FlatList
        data={units}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View>
            <Text>Name: {item.name}</Text>
            <Text>Description: {item.description}</Text>
            <Text>Level: {item.level}</Text>
          </View>
        )}
      />
    </View>
  );
};

export default AllUnitsScreen;
```

## Available Selectors

From `tanzeemSlice`:

### Basic Selectors
- `selectUserUnitDetails`: Gets the user's Tanzeemi Unit details
- `selectUserUnitStatus`: Gets the loading status for user unit
- `selectUserUnitError`: Gets any error that occurred during fetching user unit
- `selectAllTanzeemiUnits`: Gets all Tanzeemi Units
- `selectTanzeemiUnitById`: Gets a specific Tanzeemi Unit by ID
- `selectTanzeemStatus`: Gets the loading status for all units

### Hierarchy Selectors
- `selectHierarchyStatus`: Gets the loading status for the hierarchy
- `selectHierarchyError`: Gets any error that occurred during fetching the hierarchy
- `selectUnitsByLevel`: Gets the mapping of level IDs to unit IDs
- `selectUnitsByLevelId`: Gets all units for a specific level
- `selectParentUnit`: Gets the parent unit of a specific unit
- `selectChildUnits`: Gets all child units of a specific unit

## Notes

- The user's Tanzeemi Unit is automatically fetched after login when the person data is fetched, so in most cases, you don't need to dispatch `fetchUserTanzeemiUnit` manually.
- If the user doesn't have a corresponding Tanzeemi Unit record in the database, `userUnitDetails` will be `null`.
- The Tanzeemi Unit data is also added to the tanzeem entity adapter, so you can access it using `selectTanzeemiUnitById` if you know the ID.
- The hierarchy functionality allows you to navigate up and down the unit structure, making it easy to build tree-like UI components.
- The `zaili_unit_hierarchy` field can be used to display a formatted representation of the unit's position in the hierarchy.