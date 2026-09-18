@extends('errors::minimal')

@section('title', __('Server error'))
@section('code', '500')
@section('message', __('Something went wrong on our end.'))
