/**
 * i18n Type Definitions
 */

export type SupportedLanguage = "en" | "ko";

export interface Translations {
  common: {
    back: string;
    cancel: string;
    select: string;
    save: string;
    submit: string;
    apply: string;
    loading: string;
    error: string;
    none: string;
    pressEscToGoBack: string;
  };
  mainMenu: {
    title: string;
    addContext: string;
    search: string;
    listAll: string;
    config: string;
    exit: string;
    keyHints: {
      select: string;
      quit: string;
    };
  };
  config: {
    title: string;
    breadcrumb: string[];
    configureApiKeys: string;
    configured: string;
    notSet: string;
    enterKey: string;
    inputMasked: string;
    savedSuccess: string;
    returningToMenu: string;
    languageLabel: string;
    selectLanguage: string;
    vaultPath: string;
    vaultPathHint: string;
    vaultPathInvalid: string;
    vaultPathSaved: string;
    currentVaultPath: string;
    enterVaultPath: string;
    keyHints: {
      save: string;
      cancel: string;
      select: string;
      back: string;
    };
  };
  add: {
    title: string;
    breadcrumb: string[];
    selectType: string;
    types: {
      text: string;
      image: string;
      audio: string;
      record: string;
      file: string;
      meeting: string;
    };
    enterContent: string;
    enterTranscriptPath: string;
    enterFilePath: string;
    recordAudio: string;
    projectName: string;
    sprintIdentifier: string;
    processing: string;
    meetingSavedSuccess: string;
    contextSavedSuccess: string;
    labels: {
      id: string;
      title: string;
      summary: string;
      tags: string;
      project: string;
      sprint: string;
      type: string;
    };
    keyHints: {
      select: string;
      back: string;
      submit: string;
      startRecording: string;
      stopRecording: string;
      cancel: string;
    };
  };
  search: {
    title: string;
    breadcrumb: string[];
    selectMode: string;
    modes: {
      semantic: string;
      exact: string;
      tag: string;
    };
    enterQuery: string;
    enterExactText: string;
    enterTag: string;
    searching: string;
    noResults: string;
    newSearchHint: string;
    foundResults: string;
    keyHints: {
      select: string;
      back: string;
      search: string;
      navigate: string;
      view: string;
      newSearch: string;
    };
  };
  list: {
    title: string;
    breadcrumb: string[];
    selectFilter: string;
    selectType: string;
    filters: {
      none: string;
      tag: string;
      type: string;
      project: string;
      sprint: string;
    };
    types: {
      text: string;
      image: string;
      audio: string;
      file: string;
    };
    loadingContexts: string;
    enterFilterValue: string;
    retryHint: string;
    clearFilterHint: string;
    noContextsFound: string;
    showing: string;
    filteredBy: string;
    page: string;
    keyHints: {
      select: string;
      cancel: string;
      apply: string;
      navigate: string;
      page: string;
      view: string;
      filter: string;
      refresh: string;
      back: string;
    };
  };
  detail: {
    title: string;
    breadcrumb: string[];
    breadcrumbSimilar: string[];
    noContextSelected: string;
    labels: {
      id: string;
      type: string;
      summary: string;
      tags: string;
      project: string;
      sprint: string;
      source: string;
      created: string;
      updated: string;
      content: string;
    };
    noTags: string;
    findingSimilar: string;
    noSimilarFound: string;
    similarContexts: string;
    keyHints: {
      navigate: string;
      backToDetail: string;
      similar: string;
      back: string;
    };
  };
  errors: {
    prefix: string;
    servicesNotInitialized: string;
    apiKeysNotConfigured: string;
    selectConfigHint: string;
    configErrorTitle: string;
    unexpectedError: string;
    pressQToExit: string;
    // Preflight error messages
    fileTooLarge: string;
    filePermissionDenied: string;
    symlinkNotAllowed: string;
    invalidEncoding: string;
    pathTraversal: string;
    micPermissionDenied: string;
    diskSpaceLow: string;
    apiKeyInvalidFormat: string;
    emptyInput: string;
    textTooLong: string;
  };
  preflight: {
    checking: string;
    passed: string;
    failed: string;
    warnings: string;
    errors: string;
  };
  recording: {
    error: string;
    readyToRecord: string;
    pressEnterToStart: string;
    noTimeLimit: string;
    recording: string;
    chunkInfo: string;
    pressEnterToStop: string;
    stopping: string;
    transcribing: string;
    processingChunk: string;
    dependencyMissing: string;
    installWith: string;
    savingRecording: string;
    recordingSaved: string;
  };
  contextCard: {
    tags: string;
    noTags: string;
  };
  update: {
    newVersionAvailable: string;
    updatePromptTitle: string;
    currentVersion: string;
    latestVersion: string;
    updateQuestion: string;
    updating: string;
    updateSuccess: string;
    updateFailed: string;
    pressEnterToClose: string;
    pressEnterToExit: string;
    pressUToUpdate: string;
  };
}

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
];
