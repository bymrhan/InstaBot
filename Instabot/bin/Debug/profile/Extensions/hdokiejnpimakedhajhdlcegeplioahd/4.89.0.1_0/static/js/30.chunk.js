(window.webpackJsonpwebClient=window.webpackJsonpwebClient||[]).push([[30],{661:function(e,t){},662:function(e,t){},663:function(e,t){},664:function(e,t){},899:function(e,t,n){"use strict";n.r(t);var o=n(1),l=(n(0),n(660)),i=n(1179),a=n(792),s={id:0,type:"AddNote",visible:!0,completed:null,seenAt:null,color:i.a.GREY},c={hideSkillDetailsDialog:jest.fn(),toggleShowAllSkills:jest.fn(),openCreateNotes:jest.fn()};jest.mock("../../hooks/use-secondary-onboarding-actions",function(){return{useSecondaryOnboardingActions:function(){return c}}}),it("should shallow render the AddNote component without crashing",function(){var e=Object(l.shallow)(Object(o.jsx)(a.default,{skill:s,expanded:!0,fromAllSkillsDialog:!1}));expect(e).toHaveLength(1)}),it("should mount render the AddNote component without crashing and click the CTA",function(){var e=Object(l.mount)(Object(o.jsx)(a.default,{skill:s,expanded:!0,fromAllSkillsDialog:!1}));e.find(".add-note-button").at(1).simulate("click"),e.unmount(),expect(c.openCreateNotes).toHaveBeenCalled(),expect(c.hideSkillDetailsDialog).toHaveBeenCalled(),expect(c.toggleShowAllSkills).toHaveBeenCalled()})}}]);