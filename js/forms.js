(function initFormsHelpers() {
  // Helpers de validação
  const validators = {
    matricula: (value) => {
      if (!value || typeof value !== "string") return false;

      try {
        const mat = value.trim().toUpperCase();
        // Formato PT: XX-XX-XX ou XX-XX-XX ou XX-XX-XX
        return /^[A-Z]{2}-?\d{2}-?\d{2}$/.test(mat);
      } catch (error) {
        console.warn("Erro ao validar matrícula:", error);
        return false;
      }
    },
    nif: (value) => {
      if (!value || typeof value !== "string") return false;

      try {
        const nif = value.trim().replace(/\D/g, "");
        return nif.length === 9 && /^\d{9}$/.test(nif);
      } catch (error) {
        console.warn("Erro ao validar NIF:", error);
        return false;
      }
    },
    telefone: (value) => {
      if (!value || typeof value !== "string") return false;

      try {
        const tel = value.trim().replace(/\D/g, "");
        return tel.length >= 9 && tel.length <= 13;
      } catch (error) {
        console.warn("Erro ao validar telefone:", error);
        return false;
      }
    },
    email: (value) => {
      if (!value || typeof value !== "string") return false;

      try {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
      } catch (error) {
        console.warn("Erro ao validar email:", error);
        return false;
      }
    },
  };

  // Formatação automática
  const formatters = {
    matricula: (value) => {
      if (!value || typeof value !== "string") return "";

      try {
        const mat = value
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        if (mat.length >= 6) {
          return (
            mat.slice(0, 2) + "-" + mat.slice(2, 4) + "-" + mat.slice(4, 6)
          );
        }
        return mat;
      } catch (error) {
        console.warn("Erro ao formatar matrícula:", error);
        return value || "";
      }
    },
    nif: (value) => {
      if (!value || typeof value !== "string") return "";

      try {
        const nif = value.trim().replace(/\D/g, "");
        return nif.slice(0, 9);
      } catch (error) {
        console.warn("Erro ao formatar NIF:", error);
        return value || "";
      }
    },
    telefone: (value) => {
      if (!value || typeof value !== "string") return "";

      try {
        const tel = value.trim().replace(/\D/g, "");
        if (tel.length >= 9) {
          return (
            tel.slice(0, 3) +
            " " +
            tel.slice(3, 6) +
            " " +
            tel.slice(6, 9) +
            (tel.length > 9 ? " " + tel.slice(9) : "")
          );
        }
        return tel;
      } catch (error) {
        console.warn("Erro ao formatar telefone:", error);
        return value || "";
      }
    },
  };

  function createSignaturePad(canvasElement, clearButtonElement, options = {}) {
    if (!canvasElement) {
      console.warn("Elemento canvas não fornecido para signature pad");
      return { pad: null, resize: () => {}, cleanup: () => {} };
    }

    const hasSignaturePad = typeof window.SignaturePad === 'function';
    if (!hasSignaturePad) {
      console.warn("SignaturePad não está disponível");
      return { pad: null, resize: () => {}, cleanup: () => {} };
    }

    try {
      const backgroundColor = options.backgroundColor || "#ffffff";
      const maxWidthClamp = options.maxWidth || 700;
      const minWidthClamp = options.minWidth || 260;
      const baseWidth = Number(canvasElement.getAttribute("width")) || 299;
      const baseHeight = Number(canvasElement.getAttribute("height")) || 180;
      const aspect = baseHeight / baseWidth;

      const pad = new SignaturePad(canvasElement, { backgroundColor });

      const resize = () => {
        try {
          const parent = canvasElement.parentElement || canvasElement;
          const maxWidth = parent.clientWidth || baseWidth;
          const displayWidth = Math.max(
            minWidthClamp,
            Math.min(maxWidthClamp, maxWidth)
          );
          const displayHeight = Math.round(displayWidth * aspect);
          canvasElement.style.width = displayWidth + "px";
          canvasElement.style.height = displayHeight + "px";
          const ratio = Math.max(window.devicePixelRatio || 1, 1);
          canvasElement.width = Math.floor(displayWidth * ratio);
          canvasElement.height = Math.floor(displayHeight * ratio);
          const ctx = canvasElement.getContext("2d");
          if (ctx) {
            ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
          }
          // Não limpar automaticamente no resize para preservar assinatura
        } catch (error) {
          console.warn("Erro ao redimensionar signature pad:", error);
        }
      };

      // inicial e eventos
      resize();
      const onResize = () => resize();
      window.addEventListener("resize", onResize);
      window.addEventListener("orientationchange", onResize);

      if (clearButtonElement) {
        clearButtonElement.addEventListener("click", () => {
          try {
            pad.clear();
          } catch (error) {
            console.warn("Erro ao limpar signature pad:", error);
          }
        });
      }

      const cleanup = () => {
        try {
          window.removeEventListener("resize", onResize);
        } catch (error) {
          console.warn("Erro ao remover listener de resize:", error);
        }
        try {
          window.removeEventListener("orientationchange", onResize);
        } catch (error) {
          console.warn("Erro ao remover listener de orientação:", error);
        }
        try {
          if (clearButtonElement) {
            clearButtonElement.removeEventListener("click", () => pad.clear());
          }
        } catch (error) {
          console.warn("Erro ao remover listener de limpeza:", error);
        }
      };

      return { pad, resize, cleanup };
    } catch (error) {
      console.error("Erro ao criar signature pad:", error);
      return { pad: null, resize: () => {}, cleanup: () => {} };
    }
  }

  function attachWizard(formElement, config = {}) {
    if (!formElement) {
      console.warn("Elemento de formulário não fornecido para wizard");
      return null;
    }

    try {
      const stepSelector = config.stepSelector || ".wizard-step";
      const stepAttr = config.stepAttribute || "data-step";
      const onShowStep =
        typeof config.onShowStep === "function" ? config.onShowStep : () => {};
      const customValidators = config.customValidators || {}; // { [stepNumber]: () => boolean }

      let currentStep = 1;
      const steps = Array.from(formElement.querySelectorAll(stepSelector));

      if (steps.length === 0) {
        console.warn("Nenhum passo encontrado no wizard");
        return null;
      }

      const showStep = (stepNumber) => {
        try {
          if (stepNumber < 1 || stepNumber > steps.length) return false;

          steps.forEach((step, index) => {
            const stepNum = index + 1;
            if (stepNum === stepNumber) {
              step.style.display = "block";
              step.setAttribute("aria-hidden", "false");
            } else {
              step.style.display = "none";
              step.setAttribute("aria-hidden", "true");
            }
          });

          currentStep = stepNumber;

          try {
            onShowStep(stepNumber);
          } catch (error) {
            console.warn("Erro ao executar callback onShowStep:", error);
          }

          return true;
        } catch (error) {
          console.error("Erro ao mostrar passo do wizard:", error);
          return false;
        }
      };

      const nextStep = () => {
        if (currentStep < steps.length) {
          return showStep(currentStep + 1);
        }
        return false;
      };

      const prevStep = () => {
        if (currentStep > 1) {
          return showStep(currentStep - 1);
        }
        return false;
      };

      const validateCurrentStep = () => {
        try {
          const validator = customValidators[currentStep];
          if (validator && typeof validator === "function") {
            return validator();
          }
          return true;
        } catch (error) {
          console.warn("Erro ao validar passo atual:", error);
          return false;
        }
      };

      const goToStep = (stepNumber) => {
        if (stepNumber >= 1 && stepNumber <= steps.length) {
          return showStep(stepNumber);
        }
        return false;
      };

      // Mostrar primeiro passo
      showStep(1);

      return {
        currentStep: () => currentStep,
        totalSteps: () => steps.length,
        showStep,
        nextStep,
        prevStep,
        goToStep,
        validateCurrentStep,
        steps: () => [...steps],
      };
    } catch (error) {
      console.error("Erro ao criar wizard:", error);
      return null;
    }
  }

  // Expor funções globalmente
  window.formsHelpers = {
    validators,
    formatters,
    createSignaturePad,
    attachWizard,
  };

  // Limpeza na saída da página
  window.addEventListener("beforeunload", () => {
    try {
      // Limpar event listeners se necessário
    } catch (error) {
      console.warn("Erro durante limpeza de forms:", error);
    }
  });

  // Expor também no objeto forms para compatibilidade
  window.forms = window.forms || {};
  window.forms.createSignaturePad = createSignaturePad;
})();
