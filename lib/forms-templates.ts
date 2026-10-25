import type { FormInput } from "./forms-validation";

/** Formulaires de départ que l'admin peut créer en un clic, puis modifier à volonté. */

export const TEMPLATES: Record<"test" | "hydrant", { label: string; description: string; input: FormInput }> = {
  test: {
    label: "Formulaire de test",
    description: "Réponse courte, paragraphe, calendrier, liste de choix et localisation : pour tout essayer.",
    input: {
      title: "TEST FORM",
      subtitle: "Form builder test",
      headerLines: [],
      footer: "This form is for testing purposes only.",
      published: true,
      definition: {
        fields: [
          { id: "f_head01", type: "heading", label: "TEST INFORMATION" },
          { id: "f_name01", type: "short", label: "Full Name", required: true },
          { id: "f_date01", type: "date", label: "Date", width: "half", required: true },
          { id: "f_pick01", type: "select", label: "Priority", width: "half", options: [
            { id: "o_low001", label: "Low" },
            { id: "o_med001", label: "Medium" },
            { id: "o_high01", label: "High" },
          ] },
          { id: "f_loc001", type: "location", label: "Location", required: true },
          { id: "f_desc01", type: "long", label: "Description" },
        ],
        actions: [],
      },
    },
  },
  hydrant: {
    label: "Modèle : inspection de borne incendie",
    description: "Choix de la borne sur la carte ; l'état et la date d'inspection de la borne sont mis à jour à l'envoi.",
    input: {
      title: "FIRE HYDRANT INSPECTION REPORT",
      subtitle: "Hydrant Maintenance Division",
      headerLines: [],
      footer: "*Hydrant condition entered by the inspector is subject to verification.",
      published: true,
      definition: {
        fields: [
          { id: "f_head01", type: "heading", label: "HYDRANT INFORMATION" },
          { id: "f_hydr01", type: "feature", label: "Hydrant", featureKind: "hydrant", required: true },
          { id: "f_date01", type: "date", label: "Inspection Date", width: "half", required: true },
          { id: "f_cond01", type: "select", label: "Observed Condition", width: "half", required: true, options: [
            { id: "o_serv01", label: "In service" },
            { id: "o_chek01", label: "Needs follow-up" },
            { id: "o_down01", label: "Out of service" },
          ] },
          { id: "f_loc001", type: "location", label: "Location" },
          { id: "f_head02", type: "heading", label: "INSPECTION NOTES" },
          { id: "f_comm01", type: "long", label: "Comments" },
          { id: "f_insp01", type: "short", label: "Inspector Name", required: true },
        ],
        actions: [
          {
            id: "a_state01",
            type: "set_detail",
            featureField: "f_hydr01",
            detail: "status",
            source: { kind: "field", field: "f_cond01" },
            mapping: { o_serv01: "in_service", o_chek01: "to_check", o_down01: "out_of_service" },
          },
          {
            id: "a_date001",
            type: "set_detail",
            featureField: "f_hydr01",
            detail: "lastInspection",
            source: { kind: "field", field: "f_date01" },
          },
        ],
      },
    },
  },
};
