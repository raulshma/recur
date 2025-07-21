import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Platform,
} from 'react-native';
import { THEME, CURRENCIES } from '@/constants/config';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface CurrencyPickerProps {
  label?: string;
  value: string;
  onChange: (currencyCode: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

export const CurrencyPicker: React.FC<CurrencyPickerProps> = ({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCurrencies, setFilteredCurrencies] = useState<Currency[]>([]);
  
  // Get the selected currency object
  const selectedCurrency = CURRENCIES.find(currency => currency.code === value);
  
  // Filter currencies based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCurrencies(CURRENCIES as unknown as Currency[]);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = (CURRENCIES as unknown as Currency[]).filter(
        currency =>
          currency.code.toLowerCase().includes(query) ||
          currency.name.toLowerCase().includes(query)
      );
      setFilteredCurrencies(filtered);
    }
  }, [searchQuery]);
  
  const handleSelect = (currencyCode: string) => {
    onChange(currencyCode);
    setModalVisible(false);
    setSearchQuery('');
  };
  
  const renderCurrencyItem = ({ item }: { item: Currency }) => (
    <TouchableOpacity
      style={[
        styles.currencyItem,
        item.code === value && styles.selectedItem,
      ]}
      onPress={() => handleSelect(item.code)}
    >
      <Text style={styles.currencySymbol}>{item.symbol}</Text>
      <View style={styles.currencyInfo}>
        <Text style={styles.currencyCode}>{item.code}</Text>
        <Text style={styles.currencyName}>{item.name}</Text>
      </View>
      {item.code === value && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}
      
      <TouchableOpacity
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        disabled={disabled}
      >
        {selectedCurrency ? (
          <View style={styles.selectedCurrency}>
            <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
            <Text style={styles.selectedCurrencyText}>
              {selectedCurrency.code} - {selectedCurrency.name}
            </Text>
          </View>
        ) : (
          <Text style={styles.placeholderText}>Select currency</Text>
        )}
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Currency</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search currencies..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
            
            <FlatList
              data={filteredCurrencies}
              renderItem={renderCurrencyItem}
              keyExtractor={item => item.code}
              style={styles.currencyList}
              initialNumToRender={10}
              maxToRenderPerBatch={20}
              windowSize={10}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No currencies found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.SPACING.MD,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: THEME.SPACING.XS,
  },
  label: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  required: {
    color: THEME.COLORS.ERROR,
    marginLeft: THEME.SPACING.XS,
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.MD,
    backgroundColor: THEME.COLORS.SURFACE,
    minHeight: 44,
    justifyContent: 'center',
  },
  inputError: {
    borderColor: THEME.COLORS.ERROR,
    borderWidth: 2,
  },
  inputDisabled: {
    backgroundColor: THEME.COLORS.DISABLED,
    opacity: 0.7,
  },
  selectedCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontSize: THEME.FONT_SIZES.LG,
    marginRight: THEME.SPACING.SM,
  },
  selectedCurrencyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  placeholderText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  errorText: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.ERROR,
    marginTop: THEME.SPACING.XS,
    marginLeft: THEME.SPACING.XS,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: THEME.COLORS.SURFACE,
    borderTopLeftRadius: THEME.BORDER_RADIUS.LG,
    borderTopRightRadius: THEME.BORDER_RADIUS.LG,
    height: '80%',
    ...Platform.select({
      ios: {
        paddingBottom: 20,
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  modalTitle: {
    fontSize: THEME.FONT_SIZES.LG,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  closeButton: {
    padding: THEME.SPACING.SM,
  },
  closeButtonText: {
    fontSize: THEME.FONT_SIZES.LG,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
  searchContainer: {
    padding: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: THEME.COLORS.BORDER,
    borderRadius: THEME.BORDER_RADIUS.MD,
    paddingHorizontal: THEME.SPACING.MD,
    paddingVertical: THEME.SPACING.SM,
    fontSize: THEME.FONT_SIZES.MD,
    backgroundColor: THEME.COLORS.BACKGROUND,
  },
  currencyList: {
    flex: 1,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: THEME.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: THEME.COLORS.BORDER,
  },
  selectedItem: {
    backgroundColor: `${THEME.COLORS.PRIMARY}10`,
  },
  currencyInfo: {
    flex: 1,
  },
  currencyCode: {
    fontSize: THEME.FONT_SIZES.MD,
    fontWeight: '600',
    color: THEME.COLORS.TEXT_PRIMARY,
  },
  currencyName: {
    fontSize: THEME.FONT_SIZES.SM,
    color: THEME.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: THEME.FONT_SIZES.SM,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: THEME.SPACING.XL,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: THEME.FONT_SIZES.MD,
    color: THEME.COLORS.TEXT_SECONDARY,
  },
});