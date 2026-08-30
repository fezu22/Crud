import { Platform, StyleSheet } from 'react-native';
import COLORS from '../theme/colors';

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  feedImageTop: {
    marginTop: 10,
  },
  feedGallery: { gap: 10, paddingTop: 12, paddingRight: 4 },
  feedThumbnail: { width: 132, height: 104, borderRadius: 16, backgroundColor: COLORS.surfaceMuted },
  feedImageBottom: {
    marginBottom: 10,
  },
  feedLoader: {
    marginTop: 40,
  },
  feedListContent: {
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  authScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },

  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },

  logoText: {
    fontSize: 30,
  },

  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },

  brandSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },

  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },

  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 11,
  },

  toggleBtnActive: {
    backgroundColor: COLORS.accent,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  toggleBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  toggleBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },

  authCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
  },

  inputGroup: {
    marginBottom: 16,
  },

  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.3,
  },

  authInput: {
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    color: COLORS.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
  },

  optionalBadge: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '400',
  },

  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  countryCodeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.inputBorder,
    gap: 4,
  },

  countryCodeText: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },

  countryCodeArrow: {
    color: COLORS.textMuted,
    fontSize: 12,
  },

  phoneInput: {
    flex: 1,
  },

  authSubmitBtn: {
    backgroundColor: COLORS.accent,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },

  authSubmitBtnDisabled: {
    opacity: 0.6,
  },

  authSubmitText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.4,
  },

  signUpLink: {
    marginTop: 24,
    alignItems: 'center',
  },

  signUpLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  signUpLinkAccent: {
    color: COLORS.accentLight,
    fontWeight: '700',
  },

  registerModalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },

  registerModalKeyboard: {
    justifyContent: 'flex-end',
  },

  registerSheet: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingBottom:
      Platform.OS === 'ios'
        ? 40
        : 24,
    paddingTop: 12,
    maxHeight: '90%',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: COLORS.cardBorder,
  },

  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor:
      COLORS.inputBorder,
    alignSelf: 'center',
    marginBottom: 20,
  },

  registerSheetTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
  },

  registerSheetSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 24,
  },

  closeModalLink: {
    marginTop: 16,
    marginBottom: 8,
    alignItems: 'center',
  },

  closeModalLinkText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },

  header: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
  },

  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },

  headerSub: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 2,
    fontWeight: '600',
  },

  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: COLORS.white, fontWeight: '800', fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 11 },
  statLavender: { backgroundColor: COLORS.lavender },
  statMint: { backgroundColor: COLORS.mint },
  statPeach: { backgroundColor: COLORS.peach },
  statValue: { fontSize: 21, lineHeight: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, fontWeight: '700', opacity: 0.72 },
  statPurple: { color: COLORS.accent },
  statTeal: { color: '#0F766E' },
  statOrange: { color: '#C2410C' },
  searchBox: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, paddingHorizontal: 14, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder, borderRadius: 14 },
  searchIcon: { color: COLORS.textMuted, fontSize: 22, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 14, paddingVertical: 11 },
  filterScroller: { flexGrow: 0, height: 52, maxHeight: 52 },
  filterRow: { paddingLeft: 16, paddingRight: 8, paddingBottom: 7, alignItems: 'flex-start' },
  filterChip: { paddingHorizontal: 17, paddingVertical: 9, borderRadius: 18, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.cardBorder, marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  filterChipText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' },
  filterChipTextActive: { color: COLORS.white },

  userNameHighlight: {
    color: COLORS.accentLight,
    fontWeight: '700',
  },

  logoutBtn: {
    backgroundColor:
      COLORS.dangerSubtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },

  logoutBtnText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.3,
  },

  composerCard: {
    marginHorizontal: 16,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },

  composerInput: {
    backgroundColor:
      COLORS.inputBg,
    borderRadius: 12,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 15,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor:
      COLORS.inputBorder,
  },

  previewList: { gap: 10, paddingTop: 12, paddingRight: 4 },
  previewTile: { width: 84, height: 84, position: 'relative' },

  previewImage: {
    width: 84,
    height: 84,
    borderRadius: 14,
    backgroundColor:
      COLORS.inputBg,
  },

  previewRemoveBtn: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor:
      'rgba(15, 16, 26, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor:
      'rgba(255,255,255,0.15)',
  },

  previewRemoveText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },

  composerActions: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginTop: 12,
  },

  mediaButtons: {
    flexDirection: 'row',
    gap: 6,
  },

  mediaIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor:
      COLORS.accentSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },

  mediaIconText: {
    fontSize: 16,
  },

  mediaIconLabel: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },

  postBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  cancelEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor:
      COLORS.inputBorder,
  },

  cancelEditText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 13,
  },

  postBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: COLORS.accent,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  postBtnDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },

  postBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.3,
  },

  feedContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },

  feedCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 2,
  },

  feedCardMain: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },

  checkboxDone: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.success,
    backgroundColor:
      COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 1,
  },

  checkmark: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '900',
  },

  feedTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },

  feedTitleDone: {
    color: COLORS.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textDecorationLine:
      'line-through',
    lineHeight: 22,
  },

  feedDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  feedDescDone: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
    textDecorationLine:
      'line-through',
    lineHeight: 18,
  },

  feedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor:
      COLORS.inputBg,
    marginBottom: 10,
  },

  feedMediaInfo: {
    marginBottom: 4,
  },

  feedCardFooter: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255, 255, 255, 0.04)',
  },

  feedTimestamp: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },

  feedActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  editBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
      COLORS.accentSubtle,
  },

  editBtnActive: {
    backgroundColor:
      COLORS.dangerSubtle,
  },

  editText: {
    color: COLORS.accentLight,
    fontSize: 12,
    fontWeight: '600',
  },

  editTextActive: {
    color: COLORS.danger,
  },

  editingBanner: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    backgroundColor:
      COLORS.accentSubtle,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },

  editingBannerText: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: '700',
  },

  editingBannerCancel: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '700',
  },

  delBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor:
      COLORS.dangerSubtle,
  },

  delText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },

  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor:
      COLORS.accentSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  emptyIcon: {
    fontSize: 36,
  },

  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },

  sweetAlertCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.card,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 24,
  },

  warningIconCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 3,
    borderColor: '#f59e0b',
    backgroundColor:
      'rgba(245, 158, 11, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },

  warningIconSymbol: {
    fontSize: 34,
    fontWeight: '800',
    color: '#f59e0b',
    lineHeight: 38,
  },

  sweetAlertTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  sweetAlertMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },

  sweetAlertButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },

  sweetAlertCancelBtn: {
    flex: 1,
    backgroundColor:
      COLORS.inputBorder,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sweetAlertCancelText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },

  sweetAlertConfirmBtn: {
    flex: 1,
    backgroundColor: COLORS.accent,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sweetAlertDestructiveBtn: {
    backgroundColor: COLORS.danger,
  },

  sweetAlertConfirmText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default styles;
