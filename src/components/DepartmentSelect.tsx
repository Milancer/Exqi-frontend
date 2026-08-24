import { useEffect, useMemo, useState } from "react";
import {
  CloseButton,
  Combobox,
  Group,
  InputBase,
  Loader,
  Text,
  useCombobox,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import api from "../services/api";

type Department = { department_id: number; department: string };

interface DepartmentSelectProps {
  /** Selected department_id, or "" when nothing is chosen. */
  value: string | number | null;
  /** Receives the new department_id as a number, or null when cleared. */
  onChange: (value: number | null) => void;
  label?: string;
  placeholder?: string;
}

/**
 * Department picker with inline creation.
 *
 * Mantine v8 dropped `creatable` from Select, so this is the Combobox build:
 * type to filter, and when nothing matches, a "+ Create ..." row appears that
 * POSTs the department, selects it, and folds it into the list in one action.
 *
 * The component owns its own fetch so the two pages that use it don't each
 * carry duplicate `departments` state.
 */
export default function DepartmentSelect({
  value,
  onChange,
  label = "Department",
  placeholder = "Select department",
}: DepartmentSelectProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  useEffect(() => {
    api
      .get("/departments")
      .then((res) => setDepartments(res.data || []))
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "Failed to load departments",
          color: "red",
        });
      });
  }, []);

  const selected = departments.find(
    (d) => String(d.department_id) === String(value),
  );

  const trimmedSearch = search.trim();

  const filtered = useMemo(() => {
    const needle = trimmedSearch.toLowerCase();
    if (!needle) return departments;
    return departments.filter((d) =>
      d.department.toLowerCase().includes(needle),
    );
  }, [departments, trimmedSearch]);

  // Only offer creation when the typed name isn't already a department —
  // matching the backend's case-insensitive check so the row doesn't appear
  // for something that would just resolve to an existing row anyway.
  const exactMatch = departments.some(
    (d) => d.department.trim().toLowerCase() === trimmedSearch.toLowerCase(),
  );
  const canCreate = trimmedSearch.length > 0 && !exactMatch;

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const res = await api.post("/departments", { department: trimmedSearch });
      const created: Department = res.data;

      // The endpoint is idempotent, so this may be an existing department that
      // the local list already holds — key on id to avoid a duplicate entry.
      setDepartments((prev) =>
        prev.some((d) => d.department_id === created.department_id)
          ? prev
          : [...prev, created].sort((a, b) =>
              a.department.localeCompare(b.department),
            ),
      );
      onChange(created.department_id);
      setSearch("");
      combobox.closeDropdown();
    } catch {
      // Leave the dropdown open and the query intact so the name typed isn't
      // lost and the create can be retried.
      notifications.show({
        title: "Error",
        message: `Failed to create department "${trimmedSearch}"`,
        color: "red",
      });
    } finally {
      setCreating(false);
    }
  };

  const options = filtered.map((d) => (
    <Combobox.Option value={String(d.department_id)} key={d.department_id}>
      {d.department}
    </Combobox.Option>
  ));

  return (
    <Combobox
      store={combobox}
      withinPortal
      onOptionSubmit={(val) => {
        if (val === "$create") {
          void handleCreate();
          return;
        }
        onChange(Number(val));
        setSearch("");
        combobox.closeDropdown();
      }}
    >
      <Combobox.Target>
        <InputBase
          label={label}
          placeholder={placeholder}
          value={combobox.dropdownOpened ? search : selected?.department || ""}
          onChange={(event) => {
            combobox.openDropdown();
            combobox.updateSelectedOptionIndex();
            setSearch(event.currentTarget.value);
          }}
          onClick={() => combobox.openDropdown()}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => {
            combobox.closeDropdown();
            setSearch("");
          }}
          rightSection={
            creating ? (
              <Loader size={16} />
            ) : selected ? (
              <CloseButton
                size="sm"
                variant="transparent"
                aria-label="Clear department"
                // Without this the input blurs first and the dropdown steals
                // the click before onClick ever fires.
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onChange(null);
                  setSearch("");
                }}
              />
            ) : (
              <Combobox.Chevron />
            )
          }
          rightSectionPointerEvents={selected && !creating ? "all" : "none"}
          pointer
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options mah={220} style={{ overflowY: "auto" }}>
          {options}
          {canCreate && (
            <Combobox.Option value="$create" disabled={creating}>
              <Group gap={6} wrap="nowrap">
                <Text span c="dimmed">
                  +
                </Text>
                <Text span size="sm">
                  Create &quot;{trimmedSearch}&quot;
                </Text>
              </Group>
            </Combobox.Option>
          )}
          {options.length === 0 && !canCreate && (
            <Combobox.Empty>Nothing found</Combobox.Empty>
          )}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
