import {
  Combobox,
  Group,
  Loader,
  Text,
  TextInput,
  useCombobox,
  type TextInputProps,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import { useBrandSearch, type Brand } from "./queries";

type BrandNameInputProps = Omit<TextInputProps, "value" | "onChange"> & {
  value: string;
  onChange: (name: string) => void;
  onBrandSelect: (brand: Brand) => void;
};

export function BrandNameInput({
  value,
  onChange,
  onBrandSelect,
  onBlur,
  ...inputProps
}: BrandNameInputProps) {
  const [search, setSearch] = useState("");
  const { data, isFetching } = useBrandSearch(search);
  const brands = data ?? [];
  const [opened, setOpened] = useState(false);
  const dropdownOpened = opened && search.trim() !== "" && brands.length > 0;
  const combobox = useCombobox({
    opened: dropdownOpened,
    onOpenedChange: setOpened,
  });
  const { resetSelectedOption } = combobox;

  useEffect(() => {
    resetSelectedOption();
  }, [resetSelectedOption, data, dropdownOpened]);

  function selectBrand(domain: string) {
    const brand = brands.find((candidate) => candidate.domain === domain);
    if (brand) {
      onBrandSelect(brand);
    }
    setOpened(false);
  }

  return (
    <Combobox store={combobox} onOptionSubmit={selectBrand}>
      <Combobox.Target>
        <TextInput
          {...inputProps}
          value={value}
          autoComplete="off"
          rightSection={isFetching ? <Loader size="xs" /> : null}
          onChange={(event) => {
            const name = event.currentTarget.value;
            onChange(name);
            resetSelectedOption();
            setSearch(name);
            setOpened(true);
          }}
          onBlur={(event) => {
            setOpened(false);
            onBlur?.(event);
          }}
        />
      </Combobox.Target>
      <Combobox.Dropdown>
        <Combobox.Options>
          {brands.map((brand, index) => (
            <Combobox.Option
              value={brand.domain}
              key={`${brand.domain}-${index}`}
            >
              <Group gap="sm" wrap="nowrap">
                <BrandLogo domain={brand.domain} size={24} />
                <div>
                  <Text size="sm">{brand.name}</Text>
                  <Text size="xs" c="dimmed">
                    {brand.domain}
                  </Text>
                </div>
              </Group>
            </Combobox.Option>
          ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}
